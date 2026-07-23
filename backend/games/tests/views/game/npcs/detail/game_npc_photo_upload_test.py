"""Tests for the NPC photo upload init endpoint."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import CharacterPhoto, Upload
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameNpcPhotoUploadView(TokenAuthRequestMixin):
    """Tests for POST /games/<game_slug>/npcs/<character_id>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM user, and an unrelated user."""
        self.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        self.character = CharacterFactory(name='Gandalf', game=self.game, npc=True)
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=self.game, user=self.dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _editor_token(self):
        """Return the DM's token (the NPC's editor)."""
        return self.dm_token

    def _opposite_role_character(self):
        """Create and return a character of the opposite role (PC)."""
        return CharacterFactory(name='Other', game=self.game, npc=False)

    def _url(self, character_id=None):
        """Return the upload endpoint URL for the given character id (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/epic-quest/npcs/{character_id}/photo_upload.json'

    def _post(self, client, payload, token=None, character_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        return self.post(client, self._url(character_id), payload, token=token)

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the character is rejected with 403."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self._editor_token(), character_id=99999
        )
        assert response.status_code == 404

    def test_opposite_role_id_returns_404(self, client):
        """Test that an id belonging to the opposite role returns 404."""
        other = self._opposite_role_character()
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self._editor_token(), character_id=other.id
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self, client):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(client, {}, token=self._editor_token())
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_disallowed_extension_returns_400(self, client):
        """Test that a filename with a disallowed extension is rejected with 400."""
        response = self._post(client, {'filename': 'malware.exe'}, token=self._editor_token())
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_happy_path_returns_201_with_upload_id_token_and_character_id(self, client):
        """Test that a valid request from an editor returns 201 with the expected body."""
        response = self._post(client, {'filename': 'hero.png'}, token=self._editor_token())
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['character_id'] == self.character.id

    def test_filename_with_unsafe_characters_is_sanitised(self, client):
        """Test that spaces and invalid characters in the filename stem are normalized."""
        response = self._post(
            client, {'filename': 'héro (final) [v2].png'}, token=self._editor_token()
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert 'hero_final_v2_' in upload.file_path
        for char in ('é', ' ', '(', ')', '[', ']'):
            assert char not in upload.file_path
        assert upload.file_path.endswith('.png')

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'hero.png'}, token=self._editor_token())
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert 'epic-quest' in upload.file_path
        assert str(self.character.id) in upload.file_path
        assert 'hero_' in upload.file_path
        assert upload.file_path.endswith('.png')

    def test_happy_path_creates_character_photo_record(self, client):
        """Test that a valid request creates a CharacterPhoto record with ready=False."""
        response = self._post(client, {'filename': 'hero.png'}, token=self._editor_token())
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CharacterPhoto.objects.get(path=upload.file_path)
        assert photo.character == self.character
        assert photo.ready is False

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and CharacterPhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'cover.jpg'}, token=self._editor_token())
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CharacterPhoto.objects.get(character=self.character)
        assert upload.file_path == photo.path

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any character."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'cover.jpg'}, token=token)
        assert response.status_code == 201

    def test_editor_authenticated_via_session_cookie_returns_201(self, client):
        """Test that an editor authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self._editor_token().key
        session.save()
        response = client.post(
            self._url(),
            data='{"filename": "session.png"}',
            content_type='application/json',
        )
        assert response.status_code == 201

    def test_owning_player_of_unrelated_pc_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC's photo upload."""
        player = PlayerFactory(name='Bob')
        owner = UserFactory(username='owner', password='secret-password')
        player.user = owner
        player.save()
        CharacterFactory(name='Aragorn', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=owner)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_player_of_game_returns_201(self, client):
        """Test that a player of the game (via Player.game) can upload an NPC photo."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)

        response = self._post(client, {'filename': 'photo.jpg'}, token=token)

        assert response.status_code == 201

    def test_staff_user_returns_201(self, client):
        """Test that an is_staff=True user unrelated to the game can upload the NPC's photo."""
        staff_user = UserFactory(username='staff_user', password='secret-password', is_staff=True)
        token = Token.objects.create(user=staff_user)

        response = self._post(client, {'filename': 'photo.jpg'}, token=token)

        assert response.status_code == 201

    def test_player_of_game_can_upload_pc_photo(self, client):
        """Test that a player of the game (via Player.game) can upload a PC's photo."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)
        pc = CharacterFactory(name='Aragorn', game=self.game, npc=False)

        response = self.post(
            client,
            f'/games/epic-quest/pcs/{pc.id}/photo_upload.json',
            {'filename': 'photo.jpg'},
            token=token,
        )

        assert response.status_code == 201
