"""Tests for the photo upload initialisation endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, GamePhoto, Upload


@pytest.mark.django_db
class TestPhotoUploadView:
    """Tests for POST /games/<game_slug>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, a DM user, and a non-DM user."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _post(self, client, payload, token=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            '/games/epic-quest/photo_upload.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_unauthenticated_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_non_dm_user_returns_403(self, client):
        """Test that an authenticated user who is not a DM is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that an unknown game slug returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.dm_token.key}'}
        response = client.post(
            '/games/no-such-game/photo_upload.json',
            data=json.dumps({'filename': 'photo.jpg'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self, client):
        """Test that a request without filename returns 400."""
        response = self._post(client, {}, token=self.dm_token)
        assert response.status_code == 400

    def test_blank_filename_returns_400(self, client):
        """Test that a blank filename returns 400."""
        response = self._post(client, {'filename': ''}, token=self.dm_token)
        assert response.status_code == 400

    def test_happy_path_returns_201_with_id_and_token(self, client):
        """Test that a valid request returns 201 with id and token."""
        response = self._post(client, {'filename': 'cover.jpg'}, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['id'], int)
        assert isinstance(data['token'], str)
        assert len(data['token']) > 0

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with correct fields."""
        self._post(client, {'filename': 'cover.jpg'}, token=self.dm_token)
        upload = Upload.objects.get(user=self.dm_user)
        assert upload.status == Upload.STATUS_PENDING
        assert 'epic-quest' in upload.file_path
        assert 'cover' in upload.file_path
        assert '.jpg' in upload.file_path

    def test_happy_path_creates_game_photo_record(self, client):
        """Test that a valid request creates a GamePhoto record with ready=False."""
        self._post(client, {'filename': 'cover.jpg'}, token=self.dm_token)
        photo = GamePhoto.objects.get(game=self.game)
        assert photo.ready is False
        assert 'epic-quest' in photo.path
        assert 'cover' in photo.path
        assert '.jpg' in photo.path

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and GamePhoto records share the same file_path/path."""
        self._post(client, {'filename': 'cover.jpg'}, token=self.dm_token)
        upload = Upload.objects.get(user=self.dm_user)
        photo = GamePhoto.objects.get(game=self.game)
        assert upload.file_path == photo.path

    def test_superuser_can_initialise_upload(self, client):
        """Test that a superuser can initialise an upload for any game."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'cover.png'}, token=token)
        assert response.status_code == 201
