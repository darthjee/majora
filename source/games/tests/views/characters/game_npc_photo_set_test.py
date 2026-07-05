"""Tests for the NPC photo set (role update) endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterPhoto, Game, GameMaster, Player


@pytest.mark.django_db
class TestGameNpcPhotoSetView:
    """Tests for PATCH /games/<game_slug>/npcs/<character_id>/photos/<photo_id>/set.json."""

    def setup_method(self):
        """Set up a game, an NPC, a photo, a DM user, and an unrelated user."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        self.photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/1/img1.jpg', character=self.npc
        )
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _url(self, character_id=None, photo_id=None):
        """Return the set endpoint URL for the given character/photo id (defaults to fixtures)."""
        character_id = character_id if character_id is not None else self.npc.id
        photo_id = photo_id if photo_id is not None else self.photo.id
        return f'/games/epic-quest/npcs/{character_id}/photos/{photo_id}/set.json'

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
        """Test that an authenticated user unrelated to the NPC's game is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(client, {'roles': ['profile']}, token=token)
        assert response.status_code == 403

    def test_owning_player_of_unrelated_pc_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC's photo set."""
        player = Player.objects.create(name='Bob')
        owner = User.objects.create_user(username='owner', password='secret-password')
        player.user = owner
        player.save()
        Character.objects.create(name='Aragorn', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=owner)
        response = self._patch(client, {'roles': ['profile']}, token=token)
        assert response.status_code == 403

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._patch(
            client, {'roles': ['profile']}, token=self.dm_token, character_id=99999
        )
        assert response.status_code == 404

    def test_pc_id_returns_404(self, client):
        """Test that a PC id used on the NPC endpoint returns 404."""
        pc = Character.objects.create(name='Aragorn', game=self.game, npc=False)
        response = self._patch(
            client, {'roles': ['profile']}, token=self.dm_token, character_id=pc.id
        )
        assert response.status_code == 404

    def test_unknown_photo_id_returns_404(self, client):
        """Test that a non-existent photo_id returns 404."""
        response = self._patch(
            client, {'roles': ['profile']}, token=self.dm_token, photo_id=99999
        )
        assert response.status_code == 404

    def test_photo_of_another_character_returns_404(self, client):
        """Test that a photo id belonging to a different character returns 404."""
        other_npc = Character.objects.create(name='Saruman', game=self.game, npc=True)
        other_photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/2/img1.jpg', character=other_npc
        )
        response = self._patch(
            client, {'roles': ['profile']}, token=self.dm_token, photo_id=other_photo.id
        )
        assert response.status_code == 404

    def test_happy_path_sets_profile_photo(self, client):
        """Test that sending roles=['profile'] sets the NPC's profile photo."""
        response = self._patch(client, {'roles': ['profile']}, token=self.dm_token)
        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.profile_photo == self.photo

    def test_replaces_existing_profile_photo(self, client):
        """Test that setting a new profile photo replaces a previously set one."""
        previous_photo = CharacterPhoto.objects.create(
            path='photos/games/epic-quest/characters/1/img2.jpg', character=self.npc
        )
        self.npc.profile_photo = previous_photo
        self.npc.save()

        response = self._patch(client, {'roles': ['profile']}, token=self.dm_token)
        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.profile_photo == self.photo

    def test_empty_roles_is_a_noop(self, client):
        """Test that an empty roles array is a no-op and still returns 200."""
        response = self._patch(client, {'roles': []}, token=self.dm_token)
        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.profile_photo is None

    def test_unrecognized_role_is_a_noop(self, client):
        """Test that unrecognized roles are ignored and still return 200."""
        response = self._patch(client, {'roles': ['something-else']}, token=self.dm_token)
        assert response.status_code == 200
        self.npc.refresh_from_db()
        assert self.npc.profile_photo is None

    def test_superuser_can_set_profile_photo(self, client):
        """Test that a superuser is allowed to set the profile photo for any NPC."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(client, {'roles': ['profile']}, token=token)
        assert response.status_code == 200

    def test_dm_authenticated_via_session_cookie_returns_200(self, client):
        """Test that a DM authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = client.patch(
            self._url(),
            data='{"roles": ["profile"]}',
            content_type='application/json',
        )
        assert response.status_code == 200
