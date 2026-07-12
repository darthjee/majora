"""Tests for the games list view (GET list / POST create)."""

import json

import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameMaster
from games.tests.factories import GameFactory, UserFactory


@pytest.mark.django_db
class TestGamesListView:
    """Tests for the games list endpoint."""

    def test_returns_empty_list(self, client):
        """Test that an empty list is returned when no games exist."""
        response = client.get('/games.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_games(self, client):
        """Test that created games are returned in the list."""
        GameFactory(name='Game One', game_slug='game-one')
        GameFactory(name='Game Two', game_slug='game-two')
        response = client.get('/games.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2
        slugs = [g['game_slug'] for g in data]
        assert 'game-one' in slugs
        assert 'game-two' in slugs

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('games-list')
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameFactory(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            GameFactory(name=f'Game {i}', game_slug=f'game-{i}')
        response = client.get('/games.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2


class TestGamesCreateView(TestCase):
    """Tests for the POST /games.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up an authenticated user and token."""
        cls.user = UserFactory(username='creator', password='secret-password')
        cls.token = Token.objects.create(user=cls.user)

    def _post(self, client, payload, token=None):
        """Issue a POST request to the games list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.post(
            '/games.json',
            data=json.dumps(payload),
            content_type='application/json',
            **extra,
        )

    def test_valid_post_returns_201(self):
        """Test that a valid POST returns HTTP 201."""
        response = self._post(self.client, {'name': 'New Adventure'}, token=self.token)
        assert response.status_code == 201

    def test_valid_post_returns_game_detail_body(self):
        """Test that the response body matches GameDetailSerializer output."""
        response = self._post(self.client, {'name': 'New Adventure'}, token=self.token)
        data = json.loads(response.content)
        assert data['name'] == 'New Adventure'
        assert 'game_slug' in data
        assert 'description' in data
        assert 'links' in data
        assert 'photos' in data

    def test_game_slug_is_auto_generated(self):
        """Test that game_slug is generated from name automatically."""
        response = self._post(self.client, {'name': 'My Epic Campaign'}, token=self.token)
        data = json.loads(response.content)
        assert data['game_slug'] == 'my-epic-campaign'

    def test_post_without_name_returns_400(self):
        """Test that omitting name returns HTTP 400 with field errors."""
        response = self._post(self.client, {'description': 'No name given'}, token=self.token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'name' in data['errors']

    def test_post_without_token_returns_401(self):
        """Test that a POST without an auth token returns HTTP 401."""
        response = self._post(self.client, {'name': 'Unauthorized Game'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_url_accessible_by_name(self):
        """Test that the games-list URL name resolves correctly for POST."""
        url = reverse('games-list')
        assert url == '/games.json'

    def test_post_with_optional_fields(self):
        """Test that the optional description field is accepted."""
        payload = {
            'name': 'Full Game',
            'description': 'A detailed campaign.',
        }
        response = self._post(self.client, payload, token=self.token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['description'] == 'A detailed campaign.'

    def test_post_creates_game_master_for_creator(self):
        """Test that a GameMaster record is created for the authenticated creator."""
        response = self._post(self.client, {'name': 'DM Game'}, token=self.token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert GameMaster.objects.filter(game__game_slug=data['game_slug'], user=self.user).exists()

    def test_post_creates_exactly_one_game_master(self):
        """Test that exactly one GameMaster record is created after a single POST."""
        self._post(self.client, {'name': 'Solo Campaign'}, token=self.token)
        assert GameMaster.objects.filter(user=self.user).count() == 1
