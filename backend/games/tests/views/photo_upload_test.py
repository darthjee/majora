"""Tests for the photo upload init endpoint."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GamePhoto, Upload
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


class TestPhotoUploadView(TestCase):
    """Tests for POST /games/<game_slug>/photo_upload.json."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM user, and a non-DM user."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

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

    def test_unauthenticated_request_returns_401(self):
        """Test that a request without a token is rejected with 401."""
        response = self._post(self.client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_non_dm_user_returns_403(self):
        """Test that an authenticated user who is not a game master is rejected with 403."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(self.client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self):
        """Test that a non-existent game_slug returns 404."""
        extra = {'HTTP_AUTHORIZATION': f'Token {self.dm_token.key}'}
        response = self.client.post(
            '/games/no-such-game/photo_upload.json',
            data=json.dumps({'filename': 'photo.jpg'}),
            content_type='application/json',
            **extra,
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(self.client, {}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_blank_filename_returns_400(self):
        """Test that an empty filename string returns 400."""
        response = self._post(self.client, {'filename': ''}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_disallowed_extension_returns_400(self):
        """Test that a filename with a disallowed extension is rejected with 400."""
        response = self._post(self.client, {'filename': 'malware.exe'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_path_traversal_filename_is_sanitised(self):
        """Test that path traversal in the filename is stripped to the bare basename."""
        response = self._post(
            self.client, {'filename': '../../evil.jpg'}, token=self.dm_token
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert 'upload_id' in data
        upload = Upload.objects.get(pk=data['upload_id'])
        # basename stripping removes the ../..; only 'evil' stem remains in the path
        assert 'evil_' in upload.file_path
        assert '..' not in upload.file_path

    def test_happy_path_returns_201_with_upload_id_token_and_game_id(self):
        """Test that a valid request returns 201 with upload_id, token, and game_id."""
        response = self._post(self.client, {'filename': 'hero.png'}, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['game_id'] == self.game.id

    def test_happy_path_creates_upload_record(self):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(self.client, {'filename': 'hero.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert 'epic-quest' in upload.file_path
        assert 'hero_' in upload.file_path
        assert upload.file_path.endswith('.png')

    def test_happy_path_creates_game_photo_record(self):
        """Test that a valid request creates a GamePhoto record with ready=False."""
        response = self._post(self.client, {'filename': 'hero.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GamePhoto.objects.get(path=upload.file_path)
        assert photo.game == self.game
        assert photo.ready is False

    def test_upload_and_photo_share_same_file_path(self):
        """Test that the Upload and GamePhoto records share the same file_path/path."""
        response = self._post(self.client, {'filename': 'cover.jpg'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GamePhoto.objects.get(game=self.game)
        assert upload.file_path == photo.path

    def test_superuser_can_upload(self):
        """Test that a superuser is allowed to upload a photo for any game."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(self.client, {'filename': 'cover.jpg'}, token=token)
        assert response.status_code == 201

    def test_dm_authenticated_via_session_cookie_returns_201(self):
        """Test that a DM authenticated via session cookie (no Authorization header) succeeds."""
        session = self.client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = self.client.post(
            '/games/epic-quest/photo_upload.json',
            data='{"filename": "session.png"}',
            content_type='application/json',
        )
        assert response.status_code == 201
