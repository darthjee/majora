"""Tests for the game document file photo upload init endpoint."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import GameDocumentFile, GameDocumentFilePhoto, Upload
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameDocumentFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameDocumentFilePhotoUploadView(TokenAuthRequestMixin):
    """Tests for POST .../documents/<document_id>/files/<file_id>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, a document, a file, a DM, a player, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.file = GameDocumentFile.objects.create(
            game_document=self.document, path='files/scroll.pdf', name='scroll.pdf', ready=True,
        )
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)

    def _url(self, game_slug=None, document_id=None, file_id=None):
        """Return the upload endpoint URL for the given ids (default fixtures)."""
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        document_id = document_id if document_id is not None else self.document.id
        file_id = file_id if file_id is not None else self.file.id
        return f'/games/{game_slug}/documents/{document_id}/files/{file_id}/photo_upload.json'

    def _post(self, client, payload, token=None, game_slug=None, document_id=None, file_id=None):
        """Issue a POST request to the file photo upload endpoint, optionally with a token."""
        return self.post(client, self._url(game_slug, document_id, file_id), payload, token=token)

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the game is rejected with 403."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game_slug returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, game_slug='no-such-game'
        )
        assert response.status_code == 404

    def test_unknown_document_id_returns_404(self, client):
        """Test that a non-existent document_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, document_id=99999
        )
        assert response.status_code == 404

    def test_document_from_different_game_returns_404(self, client):
        """Test that a document_id belonging to a different game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_document = GameDocumentFactory(game=other_game, name='Other Document')
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, document_id=other_document.id
        )
        assert response.status_code == 404

    def test_unknown_file_id_returns_404(self, client):
        """Test that a non-existent file_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, file_id=99999
        )
        assert response.status_code == 404

    def test_file_from_different_document_returns_404(self, client):
        """Test that a file_id belonging to a different document returns 404."""
        other_document = GameDocumentFactory(game=self.game, name='Other Document')
        other_file = GameDocumentFile.objects.create(
            game_document=other_document, path='files/other.pdf', name='other.pdf', ready=True,
        )
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, file_id=other_file.id
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self, client):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(client, {}, token=self.dm_token)
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

    def test_happy_path_returns_201_with_upload_id_token_and_file_id(self, client):
        """Test that a valid request from the DM returns 201 with the expected body."""
        response = self._post(client, {'filename': 'photo.png'}, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['upload_type'] == Upload.UPLOAD_TYPE_IMAGE
        assert data['file_id'] == self.file.id

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'photo.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        expected_path = (
            f'photos/games/epic-quest/documents/{self.document.id}/'
            f'files/{self.file.id}/photo.png'
        )
        assert upload.file_path == expected_path

    def test_happy_path_creates_game_document_file_photo_record(self, client):
        """Test that a photo-less file's upload creates a new GameDocumentFilePhoto record."""
        response = self._post(client, {'filename': 'photo.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GameDocumentFilePhoto.objects.get(path=upload.file_path)
        assert photo.ready is False
        self.file.refresh_from_db()
        assert self.file.photo_id == photo.id

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and GameDocumentFilePhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'photo.jpg'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        self.file.refresh_from_db()
        assert upload.file_path == self.file.photo.path

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any file."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 201

    def test_staff_user_returns_201(self, client):
        """Test that an is_staff=True user unrelated to the game can upload the file's photo."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 201

    def test_player_of_game_returns_201(self, client):
        """Test that a player of the game can upload the file's photo."""
        response = self._post(client, {'filename': 'photo.jpg'}, token=self.player_token)
        assert response.status_code == 201

    def test_dm_authenticated_via_session_cookie_returns_201(self, client):
        """Test that a DM authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = client.post(
            self._url(),
            data='{"filename": "session.png"}',
            content_type='application/json',
        )
        assert response.status_code == 201

    def _attach_existing_photo(self):
        """Create and attach a GameDocumentFilePhoto to `self.file`, as a finalized upload."""
        expected_path = (
            f'photos/games/epic-quest/documents/{self.document.id}/'
            f'files/{self.file.id}/photo.png'
        )
        photo = GameDocumentFilePhoto.objects.create(path=expected_path, ready=True)
        self.file.photo = photo
        self.file.save()
        return photo

    def test_reupload_reuses_existing_game_document_file_photo_row(self, client):
        """Test that re-uploading reuses the same GameDocumentFilePhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(client, {'filename': 'photo.jpg'}, token=self.dm_token)
        assert response.status_code == 201

        self.file.refresh_from_db()
        assert self.file.photo_id == existing_photo.id
        expected_path = (
            f'photos/games/epic-quest/documents/{self.document.id}/'
            f'files/{self.file.id}/photo.jpg'
        )
        assert self.file.photo.path == expected_path
        assert self.file.photo.ready is False

    def test_reupload_updates_game_document_file_photo_path(self, client):
        """Test that re-uploading updates the reused GameDocumentFilePhoto's extension."""
        self._attach_existing_photo()

        response = self._post(client, {'filename': 'photo.webp'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        expected_path = (
            f'photos/games/epic-quest/documents/{self.document.id}/'
            f'files/{self.file.id}/photo.webp'
        )
        assert upload.file_path == expected_path
