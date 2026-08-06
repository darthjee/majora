"""Tests for the games list view (GET list / POST create)."""

import json

import pytest
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Game, Player
from games.tests.factories import GameDomainFactory, GameFactory, UserFactory
from majora_project.cache import memory_cache


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

    def test_post_creates_dm_player_for_creator(self):
        """Test that a Player record with is_dm=True is created for the authenticated creator."""
        response = self._post(self.client, {'name': 'DM Game'}, token=self.token)
        assert response.status_code == 201
        data = json.loads(response.content)
        player = Player.objects.get(game__game_slug=data['game_slug'], user=self.user)
        assert player.is_dm is True

    def test_post_creates_exactly_one_player_for_creator(self):
        """Test that exactly one Player record is created after a single POST."""
        self._post(self.client, {'name': 'Solo Campaign'}, token=self.token)
        assert Player.objects.filter(user=self.user).count() == 1


@pytest.mark.django_db
class TestGamesListViewDomainFlagOff:
    """Tests for /games.json with ENABLE_GAMES_PER_DOMAIN left at its default (off)."""

    def setup_method(self):
        """Clear the shared memory cache and create a couple of games."""
        memory_cache.clear()
        self.first_game = GameFactory(name='Game One', game_slug='domain-off-one')
        self.second_game = GameFactory(name='Game Two', game_slug='domain-off-two')

    @override_settings(ALLOWED_HOSTS=['*'])
    def test_returns_all_games_regardless_of_host(self, client):
        """Test that GET still returns every game when the flag is off."""
        response = client.get('/games.json', HTTP_HOST='unrecognized.example.com')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_does_not_set_skip_cache_header(self, client):
        """Test that no X-Skip-Cache header is set when the flag is off."""
        response = client.get('/games.json')
        assert 'X-Skip-Cache' not in response


@pytest.mark.django_db
class TestGamesListViewPerDomainGet:
    """Tests for GET /games.json with ENABLE_GAMES_PER_DOMAIN on."""

    def setup_method(self):
        """Set up a recognized domain with games, and clear the shared memory cache."""
        memory_cache.clear()
        self.game_domain = GameDomainFactory(domain='tenant.example.com')
        self.game = GameFactory(
            name='Tenant Game', game_slug='tenant-game',
            game_domain_groups=[self.game_domain.game_domain_group],
        )
        GameFactory(name='Other Game', game_slug='other-game')

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_recognized_domain_returns_only_its_games(self, client):
        """Test that only games under the requested domain's group are returned."""
        response = client.get('/games.json', HTTP_HOST='tenant.example.com')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['game_slug'] == 'tenant-game'

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_recognized_domain_reflects_filtered_pagination(self, client):
        """Test that the pages header reflects the filtered count, not the global one."""
        response = client.get('/games.json?per_page=1', HTTP_HOST='tenant.example.com')
        assert response['pages'] == '1'

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_recognized_domain_with_zero_games_returns_empty_list(self, client):
        """Test that a recognized domain with no games returns 200 and an empty list."""
        empty_domain = GameDomainFactory(domain='empty.example.com')
        response = client.get('/games.json', HTTP_HOST=empty_domain.domain)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_unrecognized_domain_returns_404(self, client):
        """Test that an unrecognized domain returns 404."""
        response = client.get('/games.json', HTTP_HOST='unknown.example.com')
        assert response.status_code == 404

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_recognized_domain_response_does_not_set_skip_cache_header(self, client):
        """Test that a successful GET on a recognized domain does NOT set X-Skip-Cache."""
        response = client.get('/games.json', HTTP_HOST='tenant.example.com')
        assert 'X-Skip-Cache' not in response

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_unrecognized_domain_response_sets_skip_cache_header(self, client):
        """Test that a 404 for an unrecognized domain also sets X-Skip-Cache."""
        response = client.get('/games.json', HTTP_HOST='unknown.example.com')
        assert response['X-Skip-Cache'] == 'true'

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_domain_resolved_via_x_forwarded_host(self, client):
        """Test that the domain is resolved from X-Forwarded-Host behind the proxy."""
        response = client.get(
            '/games.json',
            HTTP_HOST='internal-backend-service',
            HTTP_X_FORWARDED_HOST='tenant.example.com',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['game_slug'] == 'tenant-game'


@pytest.mark.django_db
class TestGamesListViewPerDomainPost:
    """Tests for POST /games.json with ENABLE_GAMES_PER_DOMAIN on."""

    def setup_method(self):
        """Set up a recognized domain, an authenticated user, and clear the memory cache."""
        memory_cache.clear()
        self.game_domain = GameDomainFactory(domain='tenant-create.example.com')
        self.user = UserFactory(username='domain-creator', password='secret-password')
        self.token = Token.objects.create(user=self.user)

    def _post(self, client, payload, host):
        """Issue an authenticated POST to /games.json against the given host."""
        return client.post(
            '/games.json',
            data=json.dumps(payload),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.token.key}',
            HTTP_HOST=host,
        )

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_recognized_domain_attaches_new_game_to_its_group(self, client):
        """Test that a created game is attached to the requesting domain's GameDomainGroup."""
        response = self._post(
            client, {'name': 'New Tenant Game'}, host=self.game_domain.domain,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        game = Game.objects.get(game_slug=data['game_slug'])
        assert self.game_domain.game_domain_group in game.game_domain_groups.all()

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_recognized_domain_response_sets_skip_cache_header(self, client):
        """Test that a successful POST on a recognized domain sets X-Skip-Cache."""
        response = self._post(
            client, {'name': 'Another Tenant Game'}, host=self.game_domain.domain,
        )
        assert response['X-Skip-Cache'] == 'true'

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_unrecognized_domain_returns_404(self, client):
        """Test that POSTing on an unrecognized domain returns 404."""
        response = self._post(client, {'name': 'Ghost Game'}, host='unknown.example.com')
        assert response.status_code == 404

    @override_settings(ENABLE_GAMES_PER_DOMAIN=True, ALLOWED_HOSTS=['*'])
    def test_unrecognized_domain_does_not_create_a_game(self, client):
        """Test that POSTing on an unrecognized domain creates no Game row."""
        self._post(client, {'name': 'Ghost Game'}, host='unknown.example.com')
        assert not Game.objects.filter(name='Ghost Game').exists()
