"""Tests for the upload finalize endpoint's GamePhoto handling."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GamePhoto
from games.tests.factories import GameFactory, PlayerFactory, UserFactory
from uploads.models import Upload


class TestUploadFinalizeGamePhoto(TestCase):
    """Tests for PATCH /uploads/image/<upload_id>.json against a GamePhoto upload."""

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

    def test_uploading_status_returns_200_with_file_path(self):
        """Test that status=uploading returns 200 with the file_path."""
        response = self._valid_patch(self.client, {'status': 'uploading'})
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['file_path'] == self.upload.file_path

    def test_uploading_status_sets_upload_status(self):
        """Test that status=uploading updates the Upload record's status."""
        self._valid_patch(self.client, {'status': 'uploading'})
        self.upload.refresh_from_db()
        assert self.upload.status == Upload.STATUS_UPLOADING

    def test_uploaded_status_returns_200(self):
        """Test that status=uploaded returns 200."""
        response = self._valid_patch(self.client, {'status': 'uploaded'})
        assert response.status_code == 200

    def test_uploaded_status_sets_game_photo_ready(self):
        """Test that status=uploaded sets GamePhoto.ready to True."""
        self._valid_patch(self.client, {'status': 'uploaded'})
        self.game_photo.refresh_from_db()
        assert self.game_photo.ready is True

    def test_uploaded_status_sets_game_photo(self):
        """Test that status=uploaded sets game.photo when it was unset."""
        self._valid_patch(self.client, {'status': 'uploaded'})
        self.game.refresh_from_db()
        assert self.game.photo == self.game_photo

    def test_uploaded_status_does_not_overwrite_existing_game_photo(self):
        """Test that status=uploaded does not overwrite an existing game.photo."""
        existing_cover = GamePhoto.objects.create(
            game=self.game,
            path='photos/games/epic-quest/existing.jpg',
            ready=True,
        )
        self.game.photo = existing_cover
        self.game.save()

        self._valid_patch(self.client, {'status': 'uploaded'})

        self.game.refresh_from_db()
        assert self.game.photo == existing_cover
