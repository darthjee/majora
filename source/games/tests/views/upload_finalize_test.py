"""Tests for the upload finalize endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, GamePhoto, Upload


@pytest.mark.django_db
class TestUploadFinalizeView:
    """Tests for PATCH /uploads/<upload_id>.json."""

    def setup_method(self):
        """Set up a game, a DM user, an upload, and a linked game photo."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

        self.upload = Upload.objects.create(
            user=self.dm_user,
            file_path='photos/games/epic-quest/hero_abc.jpg',
        )
        self.game_photo = GamePhoto.objects.create(
            game=self.game,
            path='photos/games/epic-quest/hero_abc.jpg',
            ready=False,
        )
        self.upload.content_object = self.game_photo
        self.upload.save()

    def _patch(self, client, upload_id, payload, token=None, upload_token=None):
        """Issue a PATCH request to the upload finalize endpoint."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        if upload_token is not None:
            extra['HTTP_X_UPLOAD_TOKEN'] = upload_token
        return client.patch(
            f'/uploads/{upload_id}.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def _valid_patch(self, client, payload=None):
        """Issue a valid PATCH request with correct token, auth, and upload token."""
        if payload is None:
            payload = {'status': 'uploading'}
        return self._patch(
            client,
            self.upload.id,
            payload,
            token=self.dm_token,
            upload_token=self.upload.token,
        )

    def test_nonexistent_upload_returns_403(self, client):
        """Test that a request for a non-existent upload ID returns 403, not 404."""
        response = self._patch(
            client,
            upload_id=99999,
            payload={'status': 'uploading'},
            token=self.dm_token,
            upload_token='any-token',
        )
        assert response.status_code == 403

    def test_wrong_upload_token_returns_403(self, client):
        """Test that a mismatched X-Upload-Token header returns 403."""
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token='wrong-token',
        )
        assert response.status_code == 403

    def test_different_user_returns_403(self, client):
        """Test that an authenticated user who does not own the upload gets 403."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_expired_upload_returns_403(self, client):
        """Test that an expired upload returns 403."""
        self.upload.expiration_time = timezone.now() - timezone.timedelta(minutes=1)
        self.upload.save()
        response = self._valid_patch(client)
        assert response.status_code == 403

    def test_already_uploaded_status_returns_403(self, client):
        """Test that an upload already in 'uploaded' state returns 403."""
        self.upload.status = Upload.STATUS_UPLOADED
        Upload.objects.filter(pk=self.upload.pk).update(status=Upload.STATUS_UPLOADED)
        response = self._valid_patch(client)
        assert response.status_code == 403

    def test_non_game_master_user_returns_403(self, client):
        """Test that a user with no game master role returns 403 on game permission check."""
        non_dm = User.objects.create_user(username='non_dm', password='secret-password')
        non_dm_token = Token.objects.create(user=non_dm)
        self.upload.user = non_dm
        Upload.objects.filter(pk=self.upload.pk).update(user=non_dm)
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            token=non_dm_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_uploading_status_returns_200_with_file_path(self, client):
        """Test that status=uploading returns 200 with the file_path."""
        response = self._valid_patch(client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_uploading_status_sets_upload_status(self, client):
        """Test that status=uploading updates the Upload record's status."""
        self._valid_patch(client, {'status': 'uploading'})
        self.upload.refresh_from_db()
        assert self.upload.status == Upload.STATUS_UPLOADING

    def test_uploaded_status_returns_200(self, client):
        """Test that status=uploaded returns 200."""
        response = self._valid_patch(client, {'status': 'uploaded'})
        assert response.status_code == 200

    def test_uploaded_status_sets_game_photo_ready(self, client):
        """Test that status=uploaded sets GamePhoto.ready to True."""
        self._valid_patch(client, {'status': 'uploaded'})
        self.game_photo.refresh_from_db()
        assert self.game_photo.ready is True

    def test_invalid_status_value_returns_400(self, client):
        """Test that an invalid status value returns 400."""
        response = self._valid_patch(client, {'status': 'invalid'})
        assert response.status_code == 400

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without an auth token returns 401."""
        response = self._patch(
            client,
            self.upload.id,
            {'status': 'uploading'},
            upload_token=self.upload.token,
        )
        assert response.status_code == 401
