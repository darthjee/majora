"""Tests for the treasures list view (GET list / POST create)."""

import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import GameFactory, SuperUserFactory, TreasureFactory, UserFactory


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
        TreasureFactory(name='Gold Ring', value=100)
        TreasureFactory(name='Silver Dagger', value=50)
        response = client.get('/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_id_name_value(self, client):
        """Test that list items include id, name, and value fields."""
        treasure = TreasureFactory(name='Gold Ring', value=100)
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
            TreasureFactory(name=f'Treasure {i}', value=i * 10)
        response = client.get('/treasures.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            TreasureFactory(name=f'Treasure {i}', value=i * 10)
        response = client.get('/treasures.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_excludes_game_exclusive_treasures(self, client):
        """Test that treasures owned exclusively by a game are excluded from the global list."""
        game = GameFactory(name='Test Game', game_slug='test-game')
        TreasureFactory(name='Global Gem', value=100)
        TreasureFactory(name='Exclusive Gem', value=200, game=game)
        response = client.get('/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Global Gem'

    def test_returns_treasures_ordered_by_value_ascending(self, client):
        """Test that treasures are returned in ascending order of value."""
        TreasureFactory(name='Expensive Gem', value=300)
        TreasureFactory(name='Cheap Gem', value=50)
        TreasureFactory(name='Mid Gem', value=150)
        response = client.get('/treasures.json')
        data = json.loads(response.content)
        assert [item['name'] for item in data] == ['Cheap Gem', 'Mid Gem', 'Expensive Gem']

    def test_ties_in_value_break_by_id(self, client):
        """Test that treasures with equal value are ordered by id ascending."""
        first = TreasureFactory(name='First Gem', value=100)
        second = TreasureFactory(name='Second Gem', value=100)
        response = client.get('/treasures.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


class TestTreasuresCreateView(TestCase):
    """Tests for the POST /treasures.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a superuser and a regular user."""
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

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

    def test_superuser_can_create_treasure(self):
        """Test that a superuser can create a treasure and receives 201."""
        response = self._post(self.client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.superuser_token)
        assert response.status_code == 201

    def test_create_returns_treasure_detail(self):
        """Test that the response body contains id, name, and value."""
        response = self._post(self.client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.superuser_token)
        data = json.loads(response.content)
        assert data['name'] == 'Dragon Gem'
        assert data['value'] == 1000
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post(self.client, {'name': 'Dragon Gem', 'value': 1000})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_superuser_post_returns_403(self):
        """Test that a non-superuser POST returns 403."""
        response = self._post(self.client, {'name': 'Dragon Gem', 'value': 1000},
                              token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_name_returns_400(self):
        """Test that a POST without name returns 400."""
        response = self._post(self.client, {'value': 100}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_missing_value_returns_400(self):
        """Test that a POST without value returns 400."""
        response = self._post(self.client, {'name': 'Gem'}, token=self.superuser_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'value' in data['errors']
