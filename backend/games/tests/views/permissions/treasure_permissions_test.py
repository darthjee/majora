"""Tests for the entity-agnostic treasure permissions-check endpoint (issue #926)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, UserFactory


class TestTreasurePermissionsView(TokenAuthRequestMixin, TestCase):
    """Tests for the GET /permissions/treasure.json endpoint."""

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
        """Issue a GET request to the treasure permissions endpoint."""
        url = '/permissions/treasure.json'
        if query:
            url = f'{url}?{query}'
        return self.get(client, url, token=token)

    def test_no_role_returns_can_edit_false(self):
        """Test that a request with no role param returns can_edit False."""
        response = self._get(self.client, token=self.superuser_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_superuser_can_edit(self):
        """Test that ?role=superuser gets can_edit True."""
        response = self._get(self.client, query='role=superuser')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_regular_user_cannot_edit_without_role(self):
        """Test that a regular real identity has no effect without a role param."""
        response = self._get(self.client, token=self.regular_token)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_staff_can_edit(self):
        """Test that ?role=staff gets can_edit True (the global/gameless action)."""
        response = self._get(self.client, query='role=staff')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_anonymous_cannot_edit(self):
        """Test that an unauthenticated request gets can_edit False."""
        response = self._get(self.client)
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_role_dm_is_a_no_op_for_the_global_gameless_action(self):
        """Test that ?role=dm never grants can_edit for the global (gameless) action."""
        response = self._get(self.client, query='role=dm')
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('permissions-treasure')
        response = self.client.get(url)
        assert response.status_code == 200

    def test_response_omits_x_skip_cache_header(self):
        """Test that a role-simulated response never sets X-Skip-Cache."""
        response = self._get(self.client, query='role=superuser')
        assert 'X-Skip-Cache' not in response

    def test_role_superuser_can_edit_regardless_of_real_identity(self):
        """Test that ?role=superuser grants can_edit True even for an anonymous caller."""
        response = self._get(self.client, query='role=superuser')
        data = json.loads(response.content)
        assert data == {'can_edit': True}

    def test_unrecognized_role_does_not_fall_back_to_real_identity(self):
        """Test that an unrecognized role still switches to the role-simulated path."""
        response = self._get(self.client, query='role=bogus')
        data = json.loads(response.content)
        assert data == {'can_edit': False}

    def test_response_is_publicly_cacheable_for_authenticated_caller(self):
        """Test that Cache-Control stays public even when the real caller is authenticated."""
        response = self._get(self.client, token=self.superuser_token, query='role=superuser')
        assert response['Cache-Control'].startswith('public')
