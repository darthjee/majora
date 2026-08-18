"""Tests for the game common item photo upload init endpoint."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import GameCommonItemPhoto
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)
from uploads.models import Upload


@pytest.mark.django_db
class TestGameCommonItemPhotoUploadView(TokenAuthRequestMixin):
    """Tests for POST /games/<game_slug>/common_items/<common_item_id>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, a common item, a DM, a player, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.common_item = GameCommonItemFactory(game=self.game, name='Healing Potion')
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=self.player_user, game=self.game)
        self.player_token = Token.objects.create(user=self.player_user)

    def _url(self, game_slug=None, common_item_id=None):
        """Return the upload endpoint URL for the given game_slug/common_item_id (defaults)."""
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        common_item_id = (
            common_item_id if common_item_id is not None else self.common_item.id
        )
        return f'/games/{game_slug}/common_items/{common_item_id}/photo_upload.json'

    def _post(self, client, payload, token=None, game_slug=None, common_item_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        return self.post(client, self._url(game_slug, common_item_id), payload, token=token)

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

    def test_unknown_common_item_id_returns_404(self, client):
        """Test that a non-existent common_item_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, common_item_id=99999
        )
        assert response.status_code == 404

    def test_common_item_from_different_game_returns_404(self, client):
        """Test that a common_item_id belonging to a different game returns 404."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_common_item = GameCommonItemFactory(game=other_game, name='Other Potion')
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token,
            common_item_id=other_common_item.id,
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

    def test_happy_path_returns_201_with_upload_id_token_and_common_item_id(self, client):
        """Test that a valid request from the DM returns 201 with the expected body."""
        response = self._post(client, {'filename': 'potion.png'}, token=self.dm_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['common_item_id'] == self.common_item.id

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'potion.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert (
            upload.file_path
            == f'photos/games/epic-quest/common_items/{self.common_item.id}/photo.png'
        )

    def test_filename_stem_with_unsafe_characters_does_not_affect_fixed_path(self, client):
        """Test that the fixed 'photo' stem is unaffected by unsafe characters in the filename."""
        response = self._post(
            client, {'filename': 'héro (final) [v2].png'}, token=self.dm_token
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert (
            upload.file_path
            == f'photos/games/epic-quest/common_items/{self.common_item.id}/photo.png'
        )

    def test_happy_path_creates_game_common_item_photo_record(self, client):
        """Test that the first upload creates a GameCommonItemPhoto record with ready=False."""
        response = self._post(client, {'filename': 'potion.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GameCommonItemPhoto.objects.get(path=upload.file_path)
        assert photo.game_common_item == self.common_item
        assert photo.ready is False
        assert (
            GameCommonItemPhoto.objects.filter(game_common_item=self.common_item).count() == 1
        )

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and GameCommonItemPhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'potion.jpg'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = GameCommonItemPhoto.objects.get(game_common_item=self.common_item)
        assert upload.file_path == photo.path

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any common item."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'potion.jpg'}, token=token)
        assert response.status_code == 201

    def test_staff_user_returns_201(self, client):
        """Test that an is_staff=True user unrelated to the game can upload the photo."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'filename': 'potion.jpg'}, token=token)
        assert response.status_code == 201

    def test_player_of_game_returns_201(self, client):
        """Test that a player of the game can upload the common item's photo."""
        response = self._post(client, {'filename': 'potion.jpg'}, token=self.player_token)
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
        """Create and attach a GameCommonItemPhoto to `self.common_item`, simulating finalize."""
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=self.common_item,
            path=f'photos/games/epic-quest/common_items/{self.common_item.id}/photo.png',
            ready=True,
        )
        self.common_item.photo = photo
        self.common_item.save()
        return photo

    def test_reupload_reuses_existing_game_common_item_photo_row(self, client):
        """Test that re-uploading reuses the same GameCommonItemPhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(client, {'filename': 'potion.jpg'}, token=self.dm_token)
        assert response.status_code == 201

        assert (
            GameCommonItemPhoto.objects.filter(game_common_item=self.common_item).count() == 1
        )
        photo = GameCommonItemPhoto.objects.get(game_common_item=self.common_item)
        assert photo.id == existing_photo.id
        assert (
            photo.path
            == f'photos/games/epic-quest/common_items/{self.common_item.id}/photo.jpg'
        )
        assert photo.ready is False

    def test_reupload_updates_game_common_item_photo_path(self, client):
        """Test that re-uploading updates the reused photo's path to the new extension."""
        self._attach_existing_photo()

        response = self._post(client, {'filename': 'potion.webp'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert (
            upload.file_path
            == f'photos/games/epic-quest/common_items/{self.common_item.id}/photo.webp'
        )
