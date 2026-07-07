"""Tests for the treasure photo upload init endpoint."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import TreasurePhoto, Upload
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    SuperUserFactory,
    TreasureFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestTreasurePhotoUploadView:
    """Tests for POST /treasures/<id>/photo_upload.json."""

    def setup_method(self):
        """Set up a treasure, a superuser, and a regular authenticated user."""
        self.treasure = TreasureFactory(name='Golden Crown', value=500)
        self.superuser = SuperUserFactory(
            username='admin', password='secret-password'
        )
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(
            username='player', password='secret-password'
        )
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _url(self, treasure_id=None):
        """Return the upload endpoint URL for the given treasure id (defaults to the treasure)."""
        treasure_id = treasure_id if treasure_id is not None else self.treasure.id
        return f'/treasures/{treasure_id}/photo_upload.json'

    def _post(self, client, payload, token=None, treasure_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(treasure_id),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_non_superuser_returns_403(self, client):
        """Test that an authenticated non-superuser is rejected with 403."""
        response = self._post(client, {'filename': 'photo.jpg'}, token=self.regular_token)
        assert response.status_code == 403

    def test_unknown_treasure_id_returns_404(self, client):
        """Test that a non-existent treasure_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.superuser_token, treasure_id=99999
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self, client):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(client, {}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_disallowed_extension_returns_400(self, client):
        """Test that a filename with a disallowed extension is rejected with 400."""
        response = self._post(client, {'filename': 'malware.exe'}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_happy_path_returns_201_with_upload_id_token_and_treasure_id(self, client):
        """Test that a valid request from a superuser returns 201 with the expected body."""
        response = self._post(client, {'filename': 'treasure.png'}, token=self.superuser_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['treasure_id'] == self.treasure.id

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'treasure.png'}, token=self.superuser_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert upload.file_path == f'photos/treasures/{self.treasure.id}/photo.png'

    def test_happy_path_creates_treasure_photo_record(self, client):
        """Test that the first upload creates a TreasurePhoto record with ready=False."""
        response = self._post(client, {'filename': 'treasure.png'}, token=self.superuser_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = TreasurePhoto.objects.get(path=upload.file_path)
        assert photo.treasure == self.treasure
        assert photo.ready is False
        assert TreasurePhoto.objects.filter(treasure=self.treasure).count() == 1

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and TreasurePhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'treasure.jpg'}, token=self.superuser_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = TreasurePhoto.objects.get(treasure=self.treasure)
        assert upload.file_path == photo.path

    def _attach_existing_photo(self):
        """Create and attach a TreasurePhoto to `self.treasure`, simulating a finalized upload."""
        photo = TreasurePhoto.objects.create(
            treasure=self.treasure,
            path=f'photos/treasures/{self.treasure.id}/photo.png',
            ready=True,
        )
        self.treasure.photo = photo
        self.treasure.save()
        return photo

    def test_reupload_reuses_existing_treasure_photo_row(self, client):
        """Test that re-uploading reuses the same TreasurePhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(client, {'filename': 'treasure.jpg'}, token=self.superuser_token)
        assert response.status_code == 201

        assert TreasurePhoto.objects.filter(treasure=self.treasure).count() == 1
        photo = TreasurePhoto.objects.get(treasure=self.treasure)
        assert photo.id == existing_photo.id
        assert photo.path == f'photos/treasures/{self.treasure.id}/photo.jpg'
        assert photo.ready is False

    def test_reupload_updates_treasure_photo_path(self, client):
        """Test that re-uploading updates the reused TreasurePhoto's path to the new extension."""
        self._attach_existing_photo()

        response = self._post(client, {'filename': 'treasure.webp'}, token=self.superuser_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.file_path == f'photos/treasures/{self.treasure.id}/photo.webp'

    def test_superuser_authenticated_via_session_cookie_returns_201(self, client):
        """Test that a superuser authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.superuser_token.key
        session.save()
        response = client.post(
            self._url(),
            data='{"filename": "session.png"}',
            content_type='application/json',
        )
        assert response.status_code == 201


@pytest.mark.django_db
class TestTreasurePhotoUploadGameExclusive:
    """Tests for the DM-aware permission on a game-exclusive treasure."""

    def setup_method(self):
        """Set up a game, a DM, and a treasure exclusive to that game."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.treasure = TreasureFactory(
            name='Game Gem', value=500, game=self.game
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.regular_user = UserFactory(
            username='player', password='secret-password'
        )
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            f'/treasures/{self.treasure.id}/photo_upload.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_dm_of_owning_game_can_upload(self, client):
        """Test that the DM of the treasure's owning game receives 201."""
        response = self._post(client, {'filename': 'gem.png'}, token=self.dm_token)
        assert response.status_code == 201

    def test_non_dm_regular_user_returns_403(self, client):
        """Test that a non-DM regular user is rejected with 403."""
        response = self._post(client, {'filename': 'gem.png'}, token=self.regular_token)
        assert response.status_code == 403
