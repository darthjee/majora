"""Tests for the NPC slain toggle endpoint."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Player


@pytest.mark.django_db
class TestGameNpcSlainSetView:
    """Tests for PATCH /games/<game_slug>/npcs/<character_id>/slain.json."""

    def setup_method(self):
        """Set up a game, an NPC, a DM user, and an unrelated user."""
        self.game = Game.objects.create(name='Epic Quest', game_slug='epic-quest')
        self.npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)

    def _url(self, game_slug=None, character_id=None):
        """Return the slain endpoint URL for the given game/character (defaults to fixtures)."""
        game_slug = game_slug if game_slug is not None else self.game.game_slug
        character_id = character_id if character_id is not None else self.npc.id
        return f'/games/{game_slug}/npcs/{character_id}/slain.json'

    def _patch(self, client, payload, token=None, game_slug=None, character_id=None):
        """Issue a PATCH request to the slain endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.patch(
            self._url(game_slug, character_id),
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_unauthenticated_request_returns_401(self, client):
        """Test that a request without a token is rejected with 401."""
        response = self._patch(client, {'slain': True})
        assert response.status_code == 401

    def test_unrelated_user_returns_403(self, client):
        """Test that an authenticated user unrelated to the NPC's game is rejected with 403."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._patch(client, {'slain': True}, token=token)
        assert response.status_code == 403

    def test_owning_player_of_unrelated_pc_returns_403(self, client):
        """Test that owning a Player never grants edit access to an NPC's slain flag."""
        player = Player.objects.create(name='Bob')
        owner = User.objects.create_user(username='owner', password='secret-password')
        player.user = owner
        player.save()
        Character.objects.create(name='Aragorn', game=self.game, player=player, npc=False)
        token = Token.objects.create(user=owner)
        response = self._patch(client, {'slain': True}, token=token)
        assert response.status_code == 403

    def test_unknown_game_slug_returns_404(self, client):
        """Test that a non-existent game_slug returns 404."""
        response = self._patch(
            client, {'slain': True}, token=self.dm_token, game_slug='no-such-game'
        )
        assert response.status_code == 404

    def test_unknown_character_id_returns_404(self, client):
        """Test that a non-existent character_id returns 404."""
        response = self._patch(
            client, {'slain': True}, token=self.dm_token, character_id=99999
        )
        assert response.status_code == 404

    def test_character_id_from_another_game_returns_404(self, client):
        """Test that a character id belonging to a different game returns 404."""
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        other_npc = Character.objects.create(name='Saruman', game=other_game, npc=True)
        response = self._patch(
            client, {'slain': True}, token=self.dm_token, character_id=other_npc.id
        )
        assert response.status_code == 404

    def test_pc_id_returns_404(self, client):
        """Test that a PC id used on the NPC endpoint returns 404."""
        pc = Character.objects.create(name='Aragorn', game=self.game, npc=False)
        response = self._patch(
            client, {'slain': True}, token=self.dm_token, character_id=pc.id
        )
        assert response.status_code == 404

    def test_missing_slain_returns_400(self, client):
        """Test that a missing slain field returns 400."""
        response = self._patch(client, {}, token=self.dm_token)
        assert response.status_code == 400

    def test_non_boolean_slain_returns_400(self, client):
        """Test that a non-boolean slain value returns 400."""
        response = self._patch(client, {'slain': 'not-a-boolean'}, token=self.dm_token)
        assert response.status_code == 400

    def test_sets_slain_to_true(self, client):
        """Test that sending slain=True marks the NPC as slain."""
        response = self._patch(client, {'slain': True}, token=self.dm_token)
        assert response.status_code == 200
        assert response.json() == {'slain': True}
        self.npc.refresh_from_db()
        assert self.npc.slain is True

    def test_sets_slain_back_to_false(self, client):
        """Test that sending slain=False reverts a slain NPC to alive."""
        self.npc.slain = True
        self.npc.save()

        response = self._patch(client, {'slain': False}, token=self.dm_token)
        assert response.status_code == 200
        assert response.json() == {'slain': False}
        self.npc.refresh_from_db()
        assert self.npc.slain is False

    def test_superuser_can_set_slain(self, client):
        """Test that a superuser is allowed to toggle the slain flag for any NPC."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._patch(client, {'slain': True}, token=token)
        assert response.status_code == 200

    def test_dm_authenticated_via_session_cookie_returns_200(self, client):
        """Test that a DM authenticated via session cookie (no auth header) succeeds."""
        session = client.session
        session['auth_token'] = self.dm_token.key
        session.save()
        response = client.patch(
            self._url(),
            data='{"slain": true}',
            content_type='application/json',
        )
        assert response.status_code == 200
