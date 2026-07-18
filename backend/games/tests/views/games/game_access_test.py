"""Tests for the game access-check view."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


class TestGameAccessView(TokenAuthRequestMixin, TestCase):
    """Tests for the game access endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

    def _get(self, client, token=None):
        """Issue a GET request to the game access endpoint, optionally with a token."""
        return self.get(client, '/games/epic-quest/access.json', token=token)

    def test_non_existent_slug_returns_200_without_can_edit(self):
        """Test that a non-existent game slug returns 200 without a can_edit field."""
        response = self.client.get('/games/no-such-game/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'can_edit' not in data

    def test_response_does_not_include_can_edit(self):
        """Test that the response never includes can_edit (moved to permissions.json)."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'can_edit' not in data

    def test_response_includes_x_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(self.client)
        assert response['X-Skip-Cache'] == 'true'

    def test_unauthenticated_returns_null_user_context_fields(self):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self._get(self.client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_staff'] is None
        assert data['is_dm'] is None
        assert data['is_player'] is None
        assert data['is_owner'] is False

    def test_dm_returns_correct_user_context_fields(self):
        """Test that DM request returns correct username, is_superuser=False, is_dm=True.

        The DM is also a Player of the game (Player.is_dm=True is the single source of
        truth for DM status), so is_player is True too.
        """
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'dm_user'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is True
        assert data['is_player'] is True
        assert data['is_owner'] is False

    def test_superuser_returns_correct_user_context_fields(self):
        """Test that superuser request returns correct username, is_superuser=True, is_dm=False."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_staff'] is True
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_non_dm_user_returns_correct_user_context_fields(self):
        """Test non-DM user returns correct username, is_superuser=False, is_dm=False."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data['username'] == 'other'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is False
        assert data['is_player'] is False
        assert data['is_owner'] is False

    def test_dm_via_session_returns_is_dm_true(self):
        """Test that the game DM authenticated via session cookie returns is_dm true."""
        token = Token.objects.create(user=self.dm_user)
        session = self.client.session
        session['auth_token'] = token.key
        session.save()
        response = self.client.get('/games/epic-quest/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['is_dm'] is True

    def test_non_dm_user_via_session_returns_is_dm_false(self):
        """Test that a non-DM user authenticated via session cookie returns is_dm false."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        session = self.client.session
        session['auth_token'] = token.key
        session.save()
        response = self.client.get('/games/epic-quest/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['is_dm'] is False
