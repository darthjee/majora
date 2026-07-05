"""Tests for the NPC access-check view."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Player


@pytest.mark.django_db
class TestGameNpcAccessView:
    """Tests for the NPC access endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')
        self.pc_owner = User.objects.create_user(username='pc_owner', password='secret-password')
        self.player.user = self.pc_owner
        self.player.save()
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        Character.objects.create(name='Frodo', game=self.game, player=self.player, npc=False)
        self.npc = Character.objects.create(
            name='Gandalf',
            game=self.game,
            npc=True,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the NPC access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/games/test-game/npcs/{self.npc.id}/access.json', **extra)

    def test_anonymous_returns_200_with_can_edit_false(self, client):
        """Test that an anonymous request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_returns_can_edit_true(self, client):
        """Test that the DM of the game returns 200 with can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_superuser_returns_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_player_owner_not_dm_returns_can_edit_false(self, client):
        """Test that a PC player (not a DM) returns 200 with can_edit false."""
        token = Token.objects.create(user=self.pc_owner)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_unrelated_user_returns_can_edit_false(self, client):
        """Test that an unrelated user returns 200 with can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_200_with_can_edit_false_for_unknown_character(self, client):
        """Test that 200 with can_edit false is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_character_in_wrong_game(self, client):
        """Test that 200 with can_edit false is returned when character belongs to another game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_pc_id(self, client):
        """Test that 200 with can_edit false is returned when the id belongs to a PC."""
        pc = Character.objects.create(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )
        response = client.get(f'/games/test-game/npcs/{pc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_who_is_also_pc_owner_returns_can_edit_true(self, client):
        """Test that a DM who also owns a PC in the game returns can_edit true for NPC."""
        dm_player = Player.objects.create(name='DM Player')
        dm_player.user = self.dm_user
        dm_player.save()
        Character.objects.create(name='DM PC', game=self.game, player=dm_player, npc=False)
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_anonymous_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM returns username, is_superuser=False, is_dm=True."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser returns username, is_superuser=True, is_dm=False."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False

    def test_non_dm_user_returns_correct_user_context_fields(self, client):
        """Test that non-DM authenticated user returns username, is_superuser=False, is_dm=False."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False

    def test_dm_via_session_returns_can_edit_true(self, client):
        """Test that the DM authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.dm_user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_non_dm_user_via_session_returns_can_edit_false(self, client):
        """Test that a non-DM user authenticated via session cookie returns can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/npcs/{self.npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False
