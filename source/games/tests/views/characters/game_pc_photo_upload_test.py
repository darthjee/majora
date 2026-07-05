"""Tests for the PC photo upload init endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterPhoto, Game, GameMaster, Player, Upload


@pytest.mark.django_db
class TestGamePcPhotoUploadView:
    """Tests for POST /games/<game_slug>/pcs/<character_id>/photo_upload.json."""

    def setup_method(self):
        """Set up a game, an owning player, a DM user, and an unrelated user."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.owner_token = Token.objects.create(user=self.owner)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _url(self, character_id=None):
        """Return the upload endpoint URL for the given character id (defaults to the PC)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/epic-quest/pcs/{character_id}/photo_upload.json'

    def _post(self, client, payload, token=None, character_id=None):
        """Issue a POST request to the photo upload endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            self._url(character_id),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._post(client, {'filename': 'photo.jpg'})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the character is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._post(client, {'filename': 'photo.jpg'}, token=token)
        assert response.status_code == 403

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.owner_token, character_id=99999
        )
        assert response.status_code == 404

    def test_npc_id_returns_404(self, client):
        """Test that an NPC id used on the PC endpoint returns 404."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = self._post(
            client, {'filename': 'photo.jpg'}, token=self.dm_token, character_id=npc.id
        )
        assert response.status_code == 404

    def test_missing_filename_returns_400(self, client):
        """Test that a missing filename field returns 400 with an errors key."""
        response = self._post(client, {}, token=self.owner_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_disallowed_extension_returns_400(self, client):
        """Test that a filename with a disallowed extension is rejected with 400."""
        response = self._post(client, {'filename': 'malware.exe'}, token=self.owner_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'errors' in data
        assert 'filename' in data['errors']

    def test_happy_path_returns_201_with_upload_id_token_and_character_id(self, client):
        """Test that a valid request from the owning player returns 201 with the expected body."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.owner_token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert isinstance(data['upload_id'], int)
        assert data['token']
        assert data['character_id'] == self.character.id

    def test_happy_path_creates_upload_record(self, client):
        """Test that a valid request creates an Upload record with pending status."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.owner_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        assert upload.status == Upload.STATUS_PENDING
        assert 'epic-quest' in upload.file_path
        assert str(self.character.id) in upload.file_path
        assert 'hero_' in upload.file_path
        assert upload.file_path.endswith('.png')

    def test_happy_path_creates_character_photo_record(self, client):
        """Test that a valid request creates a CharacterPhoto record with ready=False."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.owner_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CharacterPhoto.objects.get(path=upload.file_path)
        assert photo.character == self.character
        assert photo.ready is False

    def test_upload_and_photo_share_same_file_path(self, client):
        """Test that the Upload and CharacterPhoto records share the same file_path/path."""
        response = self._post(client, {'filename': 'cover.jpg'}, token=self.owner_token)
        data = json.loads(response.content)
        upload = Upload.objects.get(pk=data['upload_id'])
        photo = CharacterPhoto.objects.get(character=self.character)
        assert upload.file_path == photo.path

    def test_dm_can_upload(self, client):
        """Test that a DM of the character's game may upload a photo."""
        response = self._post(client, {'filename': 'hero.png'}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_upload(self, client):
        """Test that a superuser is allowed to upload a photo for any character."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._post(client, {'filename': 'cover.jpg'}, token=token)
        assert response.status_code == 201

    def test_owner_authenticated_via_session_cookie_returns_201(self, client):
        """Test that an owner authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.owner_token.key
        session.save()
        response = client.post(
            self._url(),
            data='{"filename": "session.png"}',
            content_type='application/json',
        )
        assert response.status_code == 201
