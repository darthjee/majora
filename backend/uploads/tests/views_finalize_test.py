"""Tests for the upload finalize endpoint's generic, entity-agnostic PATCH behavior."""

import json

from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token

from games.models import GamePhoto
from games.models.base_photo import BasePhoto
from games.tests.factories import GameFactory, PlayerFactory, UserFactory
from uploads.models import Upload
from uploads.views import _PHOTO_HANDLERS


class TestUploadFinalizeGeneric(TestCase):
    """Tests for PATCH /uploads/<upload_type>/<upload_id>.json generic endpoint mechanics."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM user, an upload, and a linked game photo."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

        cls.upload = Upload.objects.create(
            user=cls.dm_user,
            file_path='photos/games/epic-quest/hero_abc.jpg',
        )
        cls.game_photo = GamePhoto.objects.create(
            game=cls.game,
            path='photos/games/epic-quest/hero_abc.jpg',
            ready=False,
        )
        cls.upload.content_object = cls.game_photo
        cls.upload.save()

    def _patch(
        self, client, upload_id, payload, token=None, upload_token=None, upload_type='image',
    ):
        """Issue a PATCH request to the upload finalize endpoint."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        if upload_token is not None:
            extra['HTTP_X_UPLOAD_TOKEN'] = upload_token
        return client.patch(
            f'/uploads/{upload_type}/{upload_id}.json',
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

    def test_nonexistent_upload_returns_403(self):
        """Test that a request for a non-existent upload ID returns 403, not 404."""
        response = self._patch(
            self.client,
            upload_id=99999,
            payload={'status': 'uploading'},
            token=self.dm_token,
            upload_token='any-token',
        )
        assert response.status_code == 403

    def test_wrong_upload_token_returns_403(self):
        """Test that a mismatched X-Upload-Token header returns 403."""
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token='wrong-token',
        )
        assert response.status_code == 403

    def test_different_user_returns_403(self):
        """Test that an authenticated user who does not own the upload gets 403."""
        other_user = UserFactory(username='other', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_expired_upload_returns_403(self):
        """Test that an expired upload returns 403."""
        self.upload.expiration_time = timezone.now() - timezone.timedelta(minutes=1)
        self.upload.save()
        response = self._valid_patch(self.client)
        assert response.status_code == 403

    def test_already_uploaded_status_returns_403(self):
        """Test that an upload already in 'uploaded' state returns 403."""
        self.upload.status = Upload.STATUS_UPLOADED
        Upload.objects.filter(pk=self.upload.pk).update(status=Upload.STATUS_UPLOADED)
        response = self._valid_patch(self.client)
        assert response.status_code == 403

    def test_non_game_master_user_returns_403(self):
        """Test that a user with no game master role returns 403 on game permission check."""
        non_dm = UserFactory(username='non_dm', password='secret-password')
        non_dm_token = Token.objects.create(user=non_dm)
        self.upload.user = non_dm
        Upload.objects.filter(pk=self.upload.pk).update(user=non_dm)
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=non_dm_token,
            upload_token=self.upload.token,
        )
        assert response.status_code == 403

    def test_invalid_status_value_returns_400(self):
        """Test that an invalid status value returns 400."""
        response = self._valid_patch(self.client, {'status': 'invalid'})
        assert response.status_code == 400

    def test_unauthenticated_request_returns_401(self):
        """Test that a request without an auth token returns 401."""
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            upload_token=self.upload.token,
        )
        assert response.status_code == 401

    def test_uploading_status_via_session_cookie(self):
        """Test that status=uploading succeeds for a cookie-authenticated DM."""
        session = self.client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            upload_token=self.upload.token,
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_mismatched_upload_type_returns_404(self):
        """Test that a URL `upload_type` not matching the Upload row's type returns 404."""
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token=self.upload.token,
            upload_type='file',
        )
        assert response.status_code == 404

    def test_mismatched_upload_type_without_valid_token_returns_403(self):
        """Test that a wrong upload token with a mismatched type still returns 403, not 404."""
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token='wrong-token',
            upload_type='file',
        )
        assert response.status_code == 403

    def test_mismatched_upload_type_by_non_owner_returns_403(self):
        """Test that a non-owner (with a valid token) and a mismatched type returns 403."""
        other_user = UserFactory(username='other_type', password='secret-password')
        other_token = Token.objects.create(user=other_user)
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=other_token,
            upload_token=self.upload.token,
            upload_type='file',
        )
        assert response.status_code == 403

    def test_unrecognized_upload_type_url_segment_returns_404(self):
        """Test that an unrecognized `upload_type` URL segment 404s at routing level."""
        response = self._patch(
            self.client,
            self.upload.id,
            {'status': 'uploading'},
            token=self.dm_token,
            upload_token=self.upload.token,
            upload_type='bogus',
        )
        assert response.status_code == 404


# Models intentionally relying on _DEFAULT_HANDLERS instead of an explicit registry entry.
_DEFAULT_HANDLER_MODELS = {GamePhoto}


class TestPhotoHandlersRegistry(TestCase):
    """Guards against a BasePhoto subclass shipping without a _PHOTO_HANDLERS entry."""

    def test_every_photo_model_has_a_registered_handler(self):
        """Test that every concrete BasePhoto subclass is registered or explicitly allowlisted."""
        # BasePhoto.__subclasses__() only returns direct subclasses -- safe today since every
        # photo model subclasses BasePhoto directly, with no multi-level inheritance.
        concrete_subclasses = {
            model for model in BasePhoto.__subclasses__() if not model._meta.abstract
        }
        unregistered = concrete_subclasses - set(_PHOTO_HANDLERS) - _DEFAULT_HANDLER_MODELS
        assert not unregistered, f'Missing _PHOTO_HANDLERS entries for: {unregistered}'
