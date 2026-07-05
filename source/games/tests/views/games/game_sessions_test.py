"""Tests for the game sessions list view (GET list / POST create)."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Game, GameMaster, GameSession


@pytest.mark.django_db
class TestGameSessionsListView:
    """Tests for the GET /games/<slug>/sessions.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.other_game = Game.objects.create(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_sessions(self, client):
        """Test that an empty list is returned when the game has no sessions."""
        response = client.get('/games/test-game/sessions.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_sessions(self, client):
        """Test that only sessions linked to the game are returned."""
        GameSession.objects.create(game=self.game, title='Session One')
        GameSession.objects.create(game=self.other_game, title='Other Session')
        response = client.get('/games/test-game/sessions.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['title'] == 'Session One'

    def test_returns_id_title_date_game_slug_fields(self, client):
        """Test that list items include id, title, date, and game_slug fields."""
        session = GameSession.objects.create(
            game=self.game, title='Session One', date='2026-01-01'
        )
        response = client.get('/games/test-game/sessions.json')
        data = json.loads(response.content)
        assert data[0]['id'] == session.id
        assert data[0]['title'] == 'Session One'
        assert data[0]['date'] == '2026-01-01'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = client.get('/games/unknown-game/sessions.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/sessions.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/sessions.json')
        assert response['pages'] == '1'

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            GameSession.objects.create(game=self.game, title=f'Session {i}')
        response = client.get('/games/test-game/sessions.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameSession.objects.create(game=self.game, title=f'Session {i}')
        response = client.get('/games/test-game/sessions.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-sessions-list', kwargs={'game_slug': 'test-game'})
        response = client.get(url)
        assert response.status_code == 200

    def test_list_is_ordered_by_creation(self, client):
        """Test that the list is ordered by id (creation order), not by date."""
        first = GameSession.objects.create(
            game=self.game, title='Later Date', date='2020-01-01'
        )
        second = GameSession.objects.create(
            game=self.game, title='Earlier Date', date='2019-01-01'
        )
        response = client.get('/games/test-game/sessions.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


@pytest.mark.django_db
class TestGameSessionsCreateView:
    """Tests for the POST /games/<slug>/sessions.json endpoint."""

    def setup_method(self):
        """Set up a game, a DM, a superuser, and a regular user."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.dm_token = Token.objects.create(user=self.dm_user)
        self.superuser = User.objects.create_superuser(username='admin', password='secret-password')
        self.superuser_token = Token.objects.create(user=self.superuser)
        self.regular_user = User.objects.create_user(username='player', password='secret-password')
        self.regular_token = Token.objects.create(user=self.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game sessions list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/sessions.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_create_session(self, client):
        """Test that a DM of the game can create a session and receives 201."""
        response = self._post(client, {'title': 'Session One'}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_create_session(self, client):
        """Test that a superuser can create a session and receives 201."""
        response = self._post(client, {'title': 'Session One'}, token=self.superuser_token)
        assert response.status_code == 201

    def test_create_returns_session_detail(self, client):
        """Test that the response body contains id, title, date, game_slug, and can_edit."""
        response = self._post(
            client, {'title': 'Session One', 'date': '2026-01-01'}, token=self.dm_token
        )
        data = json.loads(response.content)
        assert data['title'] == 'Session One'
        assert data['date'] == '2026-01-01'
        assert data['game_slug'] == 'test-game'
        assert data['can_edit'] is True
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self, client):
        """Test that a POST without a token returns 401."""
        response = self._post(client, {'title': 'Session One'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self, client):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(client, {'title': 'Session One'}, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_title_returns_400(self, client):
        """Test that a POST without title returns 400."""
        response = self._post(client, {'date': '2026-01-01'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'title' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self, client):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            client, {'title': 'Session One'}, token=self.dm_token, game_slug='unknown-game'
        )
        assert response.status_code == 404

    def test_created_session_persists_to_database(self, client):
        """Test that the created session is persisted and linked to the game."""
        self._post(client, {'title': 'Session One'}, token=self.dm_token)
        assert GameSession.objects.filter(game=self.game, title='Session One').exists()
