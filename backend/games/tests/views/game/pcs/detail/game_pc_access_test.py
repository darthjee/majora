"""Tests for the PC access-check view."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    CharacterFactory,
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGamePcAccessView(TokenAuthRequestMixin):
    """Tests for the PC access endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Bob')
        self.owner = UserFactory(username='owner', password='secret-password')
        self.player.user = self.owner
        self.player.save()
        self.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=self.game, user=self.dm_user)
        self.character = CharacterFactory(
            name='Aragorn', game=self.game, player=self.player, npc=False
        )

    def _url(self, character=None, game_slug='test-game'):
        """Return the access-check URL for the given character (defaults to the fixture)."""
        character = character or self.character
        return f'/games/{game_slug}/pcs/{character.id}/access.json'

    def test_response_does_not_include_can_edit(self, client):
        """Test that the response never includes can_edit (moved to permissions.json)."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'can_edit' not in data

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, self._url())
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_200_without_can_edit_for_unknown_character(self, client):
        """Test that 200 without a can_edit field is returned for a non-existent character_id."""
        response = client.get('/games/test-game/pcs/99999/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'can_edit' not in data

    def test_returns_200_without_can_edit_for_character_in_wrong_game(self, client):
        """Test that 200 without can_edit is returned when the character belongs to another game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'can_edit' not in data

    def test_anonymous_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self.get(client, self._url())
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_staff'] is None
        assert data['is_dm'] is None
        assert data['is_player'] is None
        assert data['is_owner'] is None

    def test_dm_returns_correct_user_context_fields(self, client):
        """Test that DM returns username, is_superuser=False, is_dm=True."""
        token = Token.objects.create(user=self.dm_user)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is True
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser returns username, is_superuser=True, is_dm=False."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_staff'] is True
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_non_dm_user_returns_correct_user_context_fields(self, client):
        """Test that non-DM authenticated user returns username, is_superuser=False, is_dm=False."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_dm_via_session_returns_is_dm_true(self, client):
        """Test that the DM authenticated via session cookie returns is_dm true."""
        token = Token.objects.create(user=self.dm_user)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['is_dm'] is True

    def test_non_dm_user_via_session_returns_is_dm_false(self, client):
        """Test that a non-DM user authenticated via session cookie returns is_dm false."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = client.session
        session['auth_token'] = token.key
        session.save()
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['is_dm'] is False

    def test_owner_returns_correct_user_context_fields(self, client):
        """Test that owner returns username, is_superuser=False, is_dm=False, is_owner=True."""
        token = Token.objects.create(user=self.owner)
        response = self.get(client, self._url(), token=token)
        data = json.loads(response.content)
        assert data['username'] == 'owner'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is True
