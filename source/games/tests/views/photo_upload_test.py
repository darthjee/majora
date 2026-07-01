"""Tests for the photo upload init endpoint."""

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

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_non_dm_user_returns_403(self, client):
        """Test that an authenticated user who is not a game master is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game_slug returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.dm_token.key}'}
        response = client.post(
            '/games/no-such-game/photo_upload.json',
            data=json.dumps({'filename': 'photo.jpg'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self, client):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(client, {}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_blank_filename_returns_400(self, client):
        """Test that an empty filename string returns 400."""
        response = self._post(client, {'filename': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_disallowed_extension_returns_400(self, client):
        """Test that a filename with a disallowed extension is rejected with 400."""
        response = self._post(client, {'filename': 'malware.exe'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_path_traversal_filename_is_sanitised(self, client):
        """Test that path traversal in the filename is stripped to the bare basename."""
        response = self._post(
            client, {'filename': '../../evil.jpg'}, token=self.dm_token
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert 'id' in data
        upload = Upload.objects.get(pk=data['id'])
        # basename stripping removes the ../..; only 'evil' stem remains in the path
        assert 'evil_' in upload.file_path
        assert '..' not in upload.file_path

    def test_happy_path_returns_201_with_id_and_token(self, client):
        """Test that a valid request returns 201 with id and token."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['id'], int)
        assert data['token']

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['id'])
        assert upload.status == Upload.STATUS_PENDING
        assert 'epic-quest' in upload.file_path
        assert 'hero_' in upload.file_path
        assert upload.file_path.endswith('.png')

    def test_happy_path_creates_game_photo_record(self, client):
        """Test that a valid request creates a GamePhoto record with ready=False."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['id'])
        photo = GamePhoto.objects.get(path=upload.file_path)
        assert photo.game == self.game
        assert photo.ready is False

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and GamePhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'cover.jpg'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['id'])
        photo = GamePhoto.objects.get(game=self.game)
        assert upload.file_path == photo.path

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any game."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'cover.jpg'}, token=token)
        assert response.status_code == 201

    def test_dm_authenticated_via_session_cookie_returns_201(self, client):
        """Test that a DM authenticated via session cookie (no Authorization header) succeeds."""
        session = client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = client.post(
            '/games/epic-quest/photo_upload.json',
            data='{"filename": "session.png"}',
            content_type='application/json',
        )
        assert response.status_code == 201
