"""Tests for the game permissions-check view."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


class TestGamePermissionsView(TokenAuthRequestMixin, TestCase):
    """Tests for the game permissions endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

    def _get(self, client, token=None, query=''):
        """Issue a GET request to the game permissions endpoint, optionally with a token/query."""
        url = '/games/epic-quest/permissions.json'
        if query:
            url = f'{url}?{query}'
        return self.get(client, url, token=token)

    def test_non_existent_slug_returns_200_with_can_edit_false(self):
        """Test that a non-existent game slug returns 200 with can_edit False."""
        response = self.client.get('/games/no-such-game/permissions.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_dm_can_edit(self):
        """Test that the game's DM gets can_edit True."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_superuser_can_edit(self):
        """Test that a superuser gets can_edit True."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_non_dm_user_cannot_edit(self):
        """Test that a non-DM authenticated user gets can_edit False."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_anonymous_cannot_edit(self):
        """Test that an unauthenticated request gets can_edit False."""
        response = self._get(self.client)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_response_includes_x_skip_cache_header_without_role(self):
        """Test that the response sets X-Skip-Cache: true when no role param is given."""
        response = self._get(self.client)
        assert response['X-Skip-Cache'] == 'true'
        assert 'X-Force-Public-Cache' not in response

    def test_role_dm_can_edit_regardless_of_real_identity(self):
        """Test that ?role=dm grants can_edit True even for an anonymous caller."""
        response = self._get(self.client, query='role=dm')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_role_superuser_can_edit(self):
        """Test that ?role=superuser grants can_edit True."""
        response = self._get(self.client, query='role=superuser')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_role_player_alone_cannot_edit(self):
        """Test that ?role=player alone does not grant can_edit."""
        response = self._get(self.client, query='role=player')
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_role_dm_overrides_authenticated_non_dm_real_identity(self):
        """Test that ?role=dm grants can_edit True even when the real caller is not a DM."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token, query='role=dm')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self):
        """Test that an unrecognized role still switches to the role-simulated path."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token, query='role=bogus')
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_response_omits_x_skip_cache_and_sets_force_public_cache_with_role(self):
        """Test that a role-simulated response sets X-Force-Public-Cache instead of X-Skip-Cache."""
        response = self._get(self.client, query='role=dm')
        assert 'X-Skip-Cache' not in response
        assert response['X-Force-Public-Cache'] == 'true'

    def test_role_simulated_response_is_publicly_cacheable_for_authenticated_caller(self):
        """Test that Cache-Control stays public even when the real caller is authenticated."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token, query='role=owner')
        assert response['Cache-Control'].startswith('public')
