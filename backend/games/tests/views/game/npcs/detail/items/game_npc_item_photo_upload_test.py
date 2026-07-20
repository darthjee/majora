"""Tests for the NPC item photo upload init endpoint."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterItemPhoto, Upload
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    CharacterItemFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcItemPhotoUploadView(TokenAuthRequestMixin):
    """Tests for POST /games/<game_slug>/npcs/<character_id>/items/<item_id>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, a DM user, an unrelated user, and an NPC item."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.item = CharacterItemFactory(character=self.character)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _url(self, character_id=None, item_id=None):
        """Return the upload endpoint URL for the given character/item ids (default fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        item_id = item_id if item_id is not None else self.item.id
        return f'/games/epic-quest/npcs/{character_id}/items/{item_id}/photo_upload.json'

    def _post(self, client, payload, token=None, character_id=None, item_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        return self.post(client, self._url(character_id, item_id), payload, token=token)

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

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, character_id=99999
        )
        assert response.status_code == 404

    def test_opposite_role_character_id_returns_404(self, client):
        """Test that an id belonging to the opposite role (PC) returns 404."""
        player = PlayerFactory(name='Bob', game=self.game)
        pc = CharacterFactory(name='Aragorn', game=self.game, player=player, npc=False)
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, character_id=pc.id
        )
        assert response.status_code == 404

    def test_unknown_item_id_returns_404(self, client):
        """Test that a non-existent item_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, item_id=99999
        )
        assert response.status_code == 404

    def test_item_from_different_character_returns_404(self, client):
        """Test that an item_id belonging to a different character returns 404."""
        other_character = CharacterFactory(name='Other', game=self.game, npc=True)
        other_item = CharacterItemFactory(character=other_character)
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

    def test_happy_path_creates_upload_record_with_expected_path(self, client):
        """Test that a valid request creates an Upload record with the fixed deterministic path."""
        response = self._post(client, {'filename': 'sword.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert (
            upload.file_path
            == f'photos/games/epic-quest/npcs/{self.character.id}/items/{self.item.id}/photo.png'
        )

    def test_happy_path_creates_character_item_photo_record(self, client):
        """Test that a valid request creates a CharacterItemPhoto record with ready=False."""
        response = self._post(client, {'filename': 'sword.png'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CharacterItemPhoto.objects.get(path=upload.file_path)
        assert photo.character_item == self.item
        assert photo.ready is False

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and CharacterItemPhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'sword.jpg'}, token=self.dm_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CharacterItemPhoto.objects.get(character_item=self.item)
        assert upload.file_path == photo.path

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any NPC's item."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'sword.jpg'}, token=token)
        assert response.status_code == 201

    def test_staff_user_returns_201(self, client):
        """Test that an is_staff=True user unrelated to the game can upload the item's photo."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 201

    def test_regular_player_of_game_returns_403(self, client):
        """Test that a regular player of the game (no owner-equivalent on NPCs) gets 403."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Alice', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)

        response = self._post(client, {'filename': 'photo.jpg'}, token=token)

        assert response.status_code == 403

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
        """Create and attach a CharacterItemPhoto to `self.item`, simulating a finalized upload."""
        photo = CharacterItemPhoto.objects.create(
            character_item=self.item,
            path=f'photos/games/epic-quest/npcs/{self.character.id}/items/{self.item.id}/photo.png',
            ready=True,
        )
        self.item.photo = photo
        self.item.save()
        return photo

    def test_reupload_reuses_existing_character_item_photo_row(self, client):
        """Test that re-uploading reuses the same CharacterItemPhoto row, not a new one."""
        existing_photo = self._attach_existing_photo()

        response = self._post(client, {'filename': 'sword.jpg'}, token=self.dm_token)
        assert response.status_code == 201

        assert CharacterItemPhoto.objects.filter(character_item=self.item).count() == 1
        photo = CharacterItemPhoto.objects.get(character_item=self.item)
        assert photo.id == existing_photo.id
        assert (
            photo.path
            == f'photos/games/epic-quest/npcs/{self.character.id}/items/{self.item.id}/photo.jpg'
        )
        assert photo.ready is False
