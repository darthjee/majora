"""Tests for the treasures list view (GET list / POST create)."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Treasure


@pytest.mark.django_db
class TestTreasuresListView:
    """Tests for the GET /treasures.json endpoint."""

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no treasures exist."""
        response = client.get('/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_treasures(self, client):
        """Test that created treasures are returned in the list."""
        Treasure.objects.create(name='Gold Ring', value=100)
        Treasure.objects.create(name='Silver Dagger', value=50)
        response = client.get('/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_id_name_value(self, client):
        """Test that list items include id, name, and value fields."""
        treasure = Treasure.objects.create(name='Gold Ring', value=100)
        response = client.get('/treasures.json')
        data = json.loads(response.content)
        assert data[0]['id'] == treasure.id
        assert data[0]['name'] == 'Gold Ring'
        assert data[0]['value'] == 100

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('treasures-list')
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/treasures.json')
        assert response['pages'] == '1'

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
        response = client.get('/treasures.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
        response = client.get('/treasures.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


@pytest.mark.django_db
class TestTreasuresCreateView:
    """Tests for the POST /treasures.json endpoint."""

    def setup_method(self):
        """Set up a superuser and a regular user."""
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None):
        """Issue a POST request to the treasures list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            '/treasures.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_superuser_can_create_treasure(self, client):
        """Test that a superuser can create a treasure and receives 201."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.superuser_token)
        assert response.status_code == 201

    def test_create_returns_treasure_detail(self, client):
        """Test that the response body contains id, name, and value."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.superuser_token)
        data = json.loads(response.content)
        assert data['name'] == 'Dragon Gem'
        assert data['value'] == 1000
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self, client):
        """Test that a POST without a token returns 401."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_superuser_post_returns_403(self, client):
        """Test that a non-superuser POST returns 403."""
        response = self._post(client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_name_returns_400(self, client):
        """Test that a POST without name returns 400."""
        response = self._post(client, {'value': 100}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_value_returns_400(self, client):
        """Test that a POST without value returns 400."""
        response = self._post(client, {'name': 'Gem'}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'value' in data['errors']
