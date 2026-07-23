"""Tests for the game item photo upload init endpoint."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import GameItemPhoto, Upload
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameFactory,
    GameItemFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameItemPhotoUploadView(TokenAuthRequestMixin):
    """Tests for POST /games/<game_slug>/items/<item_id>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, an item, a DM, a player, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.item = GameItemFactory(game=self.game, name='Sword of Truth')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)

    def _url(self, game_slug=None, item_id=None):
        """Return the upload endpoint URL for the given game_slug/item_id (default fixtures)."""
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        item_id = item_id if item_id is not None else self.item.id
        return f'/games/{game_slug}/items/{item_id}/photo_upload.json'

    def _post(self, client, payload, token=None, game_slug=None, item_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        return self.post(client, self._url(game_slug, item_id), payload, token=token)

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

    def test_unknown_item_id_returns_404(self, client):
        """Test that a non-existent item_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, item_id=99999
        )
        assert response.status_code == 404

    def test_item_from_different_game_returns_404(self, client):
        """Test that an item_id belonging to a different game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_item = GameItemFactory(game=other_game, name='Other Item')
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, item_id=other_item.id
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

    def test_happy_path_returns_201_with_upload_id_token_and_item_id(self, client):
        """Test that a valid request from the DM returns 201 with the expected body."""
        response = self._post(client, {'filename': 'sword.png'}, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['item_id'] == self.item.id

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'sword.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert upload.file_path == f'photos/games/epic-quest/items/{self.item.id}/photo.png'

    def test_filename_stem_with_unsafe_characters_does_not_affect_fixed_path(self, client):
        """Test that the fixed 'photo' stem is unaffected by unsafe characters in the filename."""
        response = self._post(
            client, {'filename': 'héro (final) [v2].png'}, token=self.dm_token
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.file_path == f'photos/games/epic-quest/items/{self.item.id}/photo.png'

    def test_happy_path_creates_game_item_photo_record(self, client):
        """Test that the first upload creates a GameItemPhoto record with ready=False."""
        response = self._post(client, {'filename': 'sword.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GameItemPhoto.objects.get(path=upload.file_path)
        assert photo.game_item == self.item
        assert photo.ready is False
        assert GameItemPhoto.objects.filter(game_item=self.item).count() == 1

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and GameItemPhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'sword.jpg'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GameItemPhoto.objects.get(game_item=self.item)
        assert upload.file_path == photo.path

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any item."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'sword.jpg'}, token=token)
        assert response.status_code == 201

    def test_staff_user_returns_201(self, client):
        """Test that an is_staff=True user unrelated to the game can upload the item's photo."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'filename': 'sword.jpg'}, token=token)
        assert response.status_code == 201

    def test_player_of_game_returns_201(self, client):
        """Test that a player of the game can upload the item's photo."""
        response = self._post(client, {'filename': 'sword.jpg'}, token=self.player_token)
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
        """Create and attach a GameItemPhoto to `self.item`, simulating a finalized upload."""
        photo = GameItemPhoto.objects.create(
            game_item=self.item,
            path=f'photos/games/epic-quest/items/{self.item.id}/photo.png',
            ready=True,
        )
        self.item.photo = photo
        self.item.save()
        return photo

    def test_reupload_reuses_existing_game_item_photo_row(self, client):
        """Test that re-uploading reuses the same GameItemPhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(client, {'filename': 'sword.jpg'}, token=self.dm_token)
        assert response.status_code == 201

        assert GameItemPhoto.objects.filter(game_item=self.item).count() == 1
        photo = GameItemPhoto.objects.get(game_item=self.item)
        assert photo.id == existing_photo.id
        assert photo.path == f'photos/games/epic-quest/items/{self.item.id}/photo.jpg'
        assert photo.ready is False

    def test_reupload_updates_game_item_photo_path(self, client):
        """Test that re-uploading updates the reused GameItemPhoto's path to the new extension."""
        self._attach_existing_photo()

        response = self._post(client, {'filename': 'sword.webp'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.file_path == f'photos/games/epic-quest/items/{self.item.id}/photo.webp'
