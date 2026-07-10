"""Tests for the treasure access-check view."""

import json

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import SuperUserFactory, TreasureFactory, UserFactory


@pytest.mark.django_db
class TestTreasureAccessView(TokenAuthRequestMixin):
    """Tests for the GET /treasures/<id>/access.json endpoint."""

    def setup_method(self):
        """Set up a treasure, a superuser, and a regular user."""
        self.treasure = TreasureFactory(name='Magic Staff', value=400)
        self.superuser = SuperUserFactory(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = UserFactory(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _get(self, client, token=None):
        """Issue a GET request to the treasure access endpoint, optionally with a token."""
        return self.get(client, f'/treasures/{self.treasure.id}/access.json', token=token)

    def test_unauthenticated_returns_200_with_can_edit_false(self, client):
        """Test that an unauthenticated request returns 200 with can_edit false."""
        response = self._get(client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_unauthenticated_returns_null_user_context_fields(self, client):
        """Test that unauthenticated request returns null for username, is_superuser, is_dm."""
        response = self._get(client)
        data = json.loads(response.content)
        assert data['username'] is None
        assert data['is_superuser'] is None
        assert data['is_staff'] is None
        assert data['is_dm'] is None
        assert data['is_owner'] is False

    def test_superuser_returns_200_with_can_edit_true(self, client):
        """Test that a superuser returns 200 with can_edit true."""
        response = self._get(client, token=self.superuser_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True

    def test_superuser_returns_correct_user_context_fields(self, client):
        """Test that superuser request returns correct username, is_superuser=True, is_dm=False."""
        response = self._get(client, token=self.superuser_token)
        data = json.loads(response.content)
        assert data['username'] == 'admin'
        assert data['is_superuser'] is True
        assert data['is_staff'] is True
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_regular_user_returns_200_with_can_edit_false(self, client):
        """Test that a regular user returns 200 with can_edit false."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_regular_user_returns_correct_user_context_fields(self, client):
        """Test that regular user returns username, is_superuser=False, is_dm/is_owner=False."""
        response = self._get(client, token=self.regular_token)
        data = json.loads(response.content)
        assert data['username'] == 'player'
        assert data['is_superuser'] is False
        assert data['is_staff'] is False
        assert data['is_dm'] is False
        assert data['is_owner'] is False

    def test_non_existent_treasure_returns_200_with_can_edit_false(self, client):
        """Test that a non-existent treasure id returns 200 with can_edit false."""
        response = self.get(
            client, '/treasures/999999/access.json', token=self.superuser_token
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is False

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasure-access', kwargs={'treasure_id': self.treasure.id})
        response = client.get(url)
        assert response.status_code == 200

    def test_superuser_via_session_returns_can_edit_true(self, client):
        """Test that a superuser authenticated via session cookie returns can_edit true."""
        session = client.session
        session['auth_token'] = self.superuser_token.key
        session.save()
        response = client.get(f'/treasures/{self.treasure.id}/access.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['can_edit'] is True
