"""Tests for the PC photo set (role update) endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterPhoto, Game, GameMaster, Player


@pytest.mark.django_db
class TestGamePcPhotoSetView:

    """Tests for PATCH /games/<game_slug>/pcs/<character_id>/photos/<photo_id>/set.json."""

    def setup_method(self):
        """Set up a game, an owning player, a DM user, a character, and a photo."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.character = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        self.photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/1/img1.jpg', character=self.character
        )
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.owner_token = Token.objects.create(user=self.owner)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _url(self, character_id=None, photo_id=None):
        """Return the set endpoint URL for the given character/photo id (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.character.id
        photo_id = photo_id if photo_id is not None else self.photo.id
        return f'/games/epic-quest/pcs/{character_id}/photos/{photo_id}/set.json'

    def _patch(self, client, payload, token=None, character_id=None, photo_id=None):
        """Issue a PATCH request to the photo set endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            self._url(character_id, photo_id),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._patch(client, {'roles': ['profile']})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the character is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(client, {'roles': ['profile']}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that an unknown game slug returns 404."""
        response = client.patch(
            f'/games/unknown-game/pcs/{self.character.id}/photos/{self.photo.id}/set.json',
            data=json.dumps({'roles': ['profile']}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.owner_token.key}',
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._patch(
            client, {'roles': ['profile']}, token=self.owner_token, character_id=99999
        )
        assert response.status_code == 404

    def test_npc_id_returns_404(self, client):
        """Test that an NPC id used on the PC endpoint returns 404."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = self._patch(
            client, {'roles': ['profile']}, token=self.dm_token, character_id=npc.id
        )
        assert response.status_code == 404

    def test_unknown_photo_id_returns_404(self, client):
        """Test that a non-existent photo_id returns 404."""
        response = self._patch(
            client, {'roles': ['profile']}, token=self.owner_token, photo_id=99999
        )
        assert response.status_code == 404

    def test_photo_of_another_character_returns_404(self, client):
        """Test that a photo id belonging to a different character returns 404."""
        other_character = Character.objects.create(
            name='Legolas', game=self.game, npc=False
        )
        other_photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/2/img1.jpg', character=other_character
        )
        response = self._patch(
            client, {'roles': ['profile']}, token=self.owner_token, photo_id=other_photo.id
        )
        assert response.status_code == 404

    def test_happy_path_sets_profile_photo(self, client):
        """Test that sending roles=['profile'] sets the character's profile photo."""
        response = self._patch(client, {'roles': ['profile']}, token=self.owner_token)
        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.profile_photo == self.photo

    def test_replaces_existing_profile_photo(self, client):
        """Test that setting a new profile photo replaces a previously set one."""
        previous_photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/1/img2.jpg', character=self.character
        )
        self.character.profile_photo = previous_photo
        self.character.save()

        response = self._patch(client, {'roles': ['profile']}, token=self.owner_token)
        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.profile_photo == self.photo

    def test_empty_roles_is_a_noop(self, client):
        """Test that an empty roles array is a no-op and still returns 200."""
        response = self._patch(client, {'roles': []}, token=self.owner_token)
        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.profile_photo is None

    def test_unrecognized_role_is_a_noop(self, client):
        """Test that unrecognized roles are ignored and still return 200."""
        response = self._patch(client, {'roles': ['something-else']}, token=self.owner_token)
        assert response.status_code == 200
        self.character.refresh_from_db()
        assert self.character.profile_photo is None

    def test_dm_can_set_profile_photo(self, client):
        """Test that a DM of the character's game may set the profile photo."""
        response = self._patch(client, {'roles': ['profile']}, token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_can_set_profile_photo(self, client):
        """Test that a superuser is allowed to set the profile photo for any character."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(client, {'roles': ['profile']}, token=token)
        assert response.status_code == 200

    def test_owner_authenticated_via_session_cookie_returns_200(self, client):
        """Test that an owner authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.owner_token.key
        session.save()
        response = client.patch(
            self._url(),
            data='{"roles": ["profile"]}',
            content_type='application/json',
        )
        assert response.status_code == 200
