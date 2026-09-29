"""Tests for the entity-agnostic game recipe permissions-check endpoint (issue #1446)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory


class TestGameRecipePermissionsView(TokenAuthRequestMixin, TestCase):
    """Tests for the GET /permissions/game_recipe.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a superuser and a couple of regular users."""
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)
        cls.staff_user = UserFactory(
            username='staffer', password='secret-password', is_staff=True
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)

    def _get(self, client, token=None, query=''):
        """Issue a GET request to the game recipe permissions endpoint."""
        url = '/permissions/game_recipe.json'
        if query:
            url = f'{url}?{query}'
        return self.get(client, url, token=token)

    def test_no_role_returns_can_edit_false(self):
        """Test that a request with no role param returns can_edit False."""
        response = self._get(self.client, token=self.superuser_token)
        assert response.status_code == 200
        assert json.loads(response.content) == {'can_edit': False}

    def test_superuser_can_edit(self):
        """Test that ?role=superuser gets can_edit True (the admin shortcut)."""
        response = self._get(self.client, query='role=superuser')
        assert json.loads(response.content) == {'can_edit': True}

    def test_dm_can_edit(self):
        """Test that ?role=dm gets can_edit True (the dm shortcut)."""
        response = self._get(self.client, query='role=dm')
        assert json.loads(response.content) == {'can_edit': True}

    def test_staff_can_edit(self):
        """Test that ?role=staff gets can_edit True."""
        response = self._get(self.client, query='role=staff')
        assert json.loads(response.content) == {'can_edit': True}

    def test_player_can_edit(self):
        """Test that ?role=player gets can_edit True."""
        response = self._get(self.client, query='role=player')
        assert json.loads(response.content) == {'can_edit': True}

    def test_owner_cannot_edit(self):
        """Test that ?role=owner does not grant can_edit (owner isn't a configured role)."""
        response = self._get(self.client, query='role=owner')
        assert json.loads(response.content) == {'can_edit': False}

    def test_regular_user_cannot_edit_without_role(self):
        """Test that a regular real identity has no effect without a role param."""
        response = self._get(self.client, token=self.regular_token)
        assert json.loads(response.content) == {'can_edit': False}

    def test_anonymous_cannot_edit(self):
        """Test that an unauthenticated request gets can_edit False."""
        response = self._get(self.client)
        assert json.loads(response.content) == {'can_edit': False}

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self):
        """Test that an unrecognized role still switches to the role-simulated path."""
        response = self._get(self.client, query='role=bogus')
        assert json.loads(response.content) == {'can_edit': False}

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        response = self.client.get(reverse('permissions-game-recipe'))
        assert response.status_code == 200

    def test_response_omits_x_skip_cache_header(self):
        """Test that a role-simulated response never sets X-Skip-Cache."""
        response = self._get(self.client, query='role=staff')
        assert 'X-Skip-Cache' not in response

    def test_response_is_publicly_cacheable_for_authenticated_caller(self):
        """Test that Cache-Control stays public even when the real caller is authenticated."""
        response = self._get(self.client, token=self.staff_token, query='role=staff')
        assert response['Cache-Control'].startswith('public')
