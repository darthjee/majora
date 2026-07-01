"""Tests for the PC access-check view."""

import json

import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from games.models import Character, Game, GameMaster, Player


@pytest.mark.django_db
class TestGamePcAccessView:

    """Tests for the PC access endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Bob')
        self.owner = User.objects.create_user(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.character = Character.objects.create(
            name='Aragorn',
            game=self.game,
            player=self.player,
            npc=False,
        )

    def _get(self, client, token=None):
        """Issue a GET request to the PC access endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(f'/games/test-game/pcs/{self.character.id}/access.json', **extra)

    def test_anonymous_returns_200_with_can_edit_false(self, client):
        """Test that an anonymous request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_owner_returns_can_edit_true(self, client):
        """Test that the PC owner returns 200 with can_edit true."""
        token = Token.objects.create(user=self.owner)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

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
        response = client.get('/games/test-game/pcs/99999/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_character_in_wrong_game(self, client):
        """Test that 200 with can_edit false is returned when character belongs to another game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_returns_200_with_can_edit_false_for_npc_id(self, client):
        """Test that 200 with can_edit false is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = client.get(f'/games/test-game/pcs/{npc.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_dm_who_is_also_owner_returns_can_edit_true(self, client):
        """Test that a user who is both DM and character owner returns can_edit true."""
        dm_player = Player.objects.create(name='DM Player')
        dm_player.user = self.dm_user
        dm_player.save()
        self.character.player = dm_player
        self.character.save()
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_anonymous_returns_null_user_context_fields(self, client):
        """Test unauthenticated request returns null for username, is_superuser, is_dm, is_owner."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_dm'] is None
        assert data['is_owner'] is None

    def test_owner_returns_correct_user_context_fields(self, client):
        """Test that owner returns username, is_superuser=False, is_dm=False, is_owner=True."""
        token = Token.objects.create(user=self.owner)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'owner'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is True

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM returns username, is_superuser=False, is_dm=True, is_owner=False."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_dm'] is True
        assert data['is_owner'] is False

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser returns username, is_superuser=True, is_dm=False, is_owner=False."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_unrelated_user_returns_correct_user_context_fields(self, client):
        """Test unrelated user returns username, is_superuser=False, is_dm=False, is_owner=False."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_owner_via_session_returns_can_edit_true(self, client):
        """Test that the PC owner authenticated via session cookie returns can_edit true."""
        token = Token.objects.create(user=self.owner)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_unrelated_user_via_session_returns_can_edit_false(self, client):
        """Test that an unrelated user authenticated via session cookie returns can_edit false."""
        other = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(f'/games/test-game/pcs/{self.character.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False
