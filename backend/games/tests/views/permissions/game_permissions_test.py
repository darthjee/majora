"""Tests for the entity-agnostic game permissions-check endpoint (issue #926)."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameFactory, PlayerFactory, UserFactory


class TestGamePermissionsView(TokenAuthRequestMixin, TestCase):
    """Tests for the GET /permissions/game.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a DM user."""
        cls.game = GameFactory(name='Epic Quest', game_slug='epic-quest')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)

    def _get(self, client, token=None, query=''):
        """Issue a GET request to the game permissions endpoint, optionally with a token/query."""
        url = '/permissions/game.json'
        if query:
            url = f'{url}?{query}'
        return self.get(client, url, token=token)

    def _all_false(self):
        """Return the expected response when no permission is granted."""
        return {
            'can_edit': False,
            'can_edit_regular': False,
            'can_create_item': False,
            'can_create_document': False,
            'can_create_possession': False,
            'can_edit_session': False,
            'can_create_npc': False,
            'can_create_faction': False,
        }

    def _all_true(self):
        """Return the expected response when every permission is granted."""
        return {
            'can_edit': True,
            'can_edit_regular': True,
            'can_create_item': True,
            'can_create_document': True,
            'can_create_possession': True,
            'can_edit_session': True,
            'can_create_npc': True,
            'can_create_faction': True,
        }

    def test_no_role_returns_all_false(self):
        """Test that a request with no role param returns every permission False."""
        response = self._get(self.client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_dm_can_edit(self):
        """Test that ?role=dm grants every permission True."""
        response = self._get(self.client, query='role=dm')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_superuser_can_edit(self):
        """Test that ?role=superuser grants every permission True."""
        response = self._get(self.client, query='role=superuser')
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_non_dm_authenticated_user_gets_all_false_without_role(self):
        """Test that an authenticated real identity has no effect without a role param."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_player_cannot_edit_but_can_create_and_edit_session(self):
        """Test that ?role=player gets can_edit False, but the rest True (issue #864)."""
        response = self._get(self.client, query='role=player')
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_edit_regular': True,
            'can_create_item': True,
            'can_create_document': True,
            'can_create_possession': True,
            'can_edit_session': True,
            'can_create_npc': True,
            'can_create_faction': True,
        }

    def test_staff_cannot_edit_but_can_create_and_edit_session(self):
        """Test that ?role=staff gets can_edit False, but the rest True."""
        response = self._get(self.client, query='role=staff')
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_edit_regular': True,
            'can_create_item': True,
            'can_create_document': True,
            'can_create_possession': True,
            'can_edit_session': True,
            'can_create_npc': True,
            'can_create_faction': True,
        }

    def test_owner_cannot_edit_regular(self):
        """Test that ?role=owner (PC-scoped, not a game role) gets can_edit_regular False."""
        response = self._get(self.client, query='role=owner')
        data = json.loads(response.content)
        assert data['can_edit_regular'] is False

    def test_anonymous_cannot_edit(self):
        """Test that an unauthenticated request gets every permission False."""
        response = self._get(self.client)
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_role_dm_overrides_authenticated_non_dm_real_identity(self):
        """Test that ?role=dm grants every permission True even when real caller isn't a DM."""
        other = UserFactory(username='other2', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token, query='role=dm')
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self):
        """Test that an unrecognized role still switches to the role-simulated path."""
        response = self._get(self.client, query='role=bogus')
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_response_omits_x_skip_cache_header(self):
        """Test that a role-simulated response never sets X-Skip-Cache."""
        response = self._get(self.client, query='role=dm')
        assert 'X-Skip-Cache' not in response

    def test_response_is_publicly_cacheable_for_authenticated_caller(self):
        """Test that Cache-Control stays public even when the real caller is authenticated."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token, query='role=owner')
        assert response['Cache-Control'].startswith('public')

    def test_response_is_identical_regardless_of_which_games_exist(self):
        """Test that the response for a given role doesn't depend on any real game in the DB."""
        response_with_games = self._get(self.client, query='role=dm')
        GameFactory(name='Another Quest', game_slug='another-quest')
        response_with_more_games = self._get(self.client, query='role=dm')
        assert response_with_games.content == response_with_more_games.content
