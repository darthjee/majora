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

    def _all_false(self):
        """Return the expected response when no permission is granted."""
        return {
            'can_edit': False,
            'can_create_item': False,
            'can_create_document': False,
            'can_edit_session': False,
            'can_create_npc': False,
        }

    def _all_true(self):
        """Return the expected response when every permission is granted."""
        return {
            'can_edit': True,
            'can_create_item': True,
            'can_create_document': True,
            'can_edit_session': True,
            'can_create_npc': True,
        }

    def test_non_existent_slug_returns_200_with_can_edit_false(self):
        """Test that a non-existent game slug returns 200 with every permission False."""
        response = self.client.get('/games/no-such-game/permissions.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_dm_can_edit(self):
        """Test that the game's DM gets every permission True."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token, query='role=dm')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_superuser_can_edit(self):
        """Test that a superuser gets every permission True."""
        superuser = SuperUserFactory(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = self._get(self.client, token=token, query='role=superuser')
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_non_dm_user_cannot_edit(self):
        """Test that a non-DM, non-player authenticated user gets every permission False."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token)
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_player_cannot_edit_but_can_create_and_edit_session(self):
        """Test that a player gets can_edit False, but the rest True (issue #864)."""
        player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=player_user, game=self.game)
        token = Token.objects.create(user=player_user)
        response = self._get(self.client, token=token, query='role=player')
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_create_item': True,
            'can_create_document': True,
            'can_edit_session': True,
            'can_create_npc': True,
        }

    def test_staff_cannot_edit_but_can_create_and_edit_session(self):
        """Test that a global Staff account gets can_edit False, but the rest True."""
        staff_user = UserFactory(username='staff_user', password='secret-password')
        staff_user.is_staff = True
        staff_user.save()
        token = Token.objects.create(user=staff_user)
        response = self._get(self.client, token=token, query='role=staff')
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_create_item': True,
            'can_create_document': True,
            'can_edit_session': True,
            'can_create_npc': True,
        }

    def test_anonymous_cannot_edit(self):
        """Test that an unauthenticated request gets every permission False."""
        response = self._get(self.client)
        data = json.loads(response.content)
        assert data == self._all_false()

    def test_response_sets_force_public_cache_header_without_role(self):
        """Test that the response sets X-Force-Public-Cache: true even with no role param."""
        response = self._get(self.client)
        assert response['X-Force-Public-Cache'] == 'true'
        assert 'X-Skip-Cache' not in response

    def test_role_dm_can_edit_regardless_of_real_identity(self):
        """Test that ?role=dm grants every permission True even for an anonymous caller."""
        response = self._get(self.client, query='role=dm')
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_role_superuser_can_edit(self):
        """Test that ?role=superuser grants every permission True."""
        response = self._get(self.client, query='role=superuser')
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_role_staff_cannot_edit_but_can_create_and_edit_session(self):
        """Test that ?role=staff grants can_create_item/document/session but not can_edit."""
        response = self._get(self.client, query='role=staff')
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_create_item': True,
            'can_create_document': True,
            'can_edit_session': True,
            'can_create_npc': True,
        }

    def test_role_player_cannot_edit_but_can_create_and_edit_session(self):
        """Test that ?role=player grants can_create_item/document/can_edit_session (issue #864)."""
        response = self._get(self.client, query='role=player')
        data = json.loads(response.content)
        assert data == {
            'can_edit': False,
            'can_create_item': True,
            'can_create_document': True,
            'can_edit_session': True,
            'can_create_npc': True,
        }

    def test_role_dm_overrides_authenticated_non_dm_real_identity(self):
        """Test that ?role=dm grants every permission True even when real caller isn't."""
        other = UserFactory(username='other', password='secret-password')
        token = Token.objects.create(user=other)
        response = self._get(self.client, token=token, query='role=dm')
        data = json.loads(response.content)
        assert data == self._all_true()

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self):
        """Test that an unrecognized role still switches to the role-simulated path."""
        token = Token.objects.create(user=self.dm_user)
        response = self._get(self.client, token=token, query='role=bogus')
        data = json.loads(response.content)
        assert data == self._all_false()

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
