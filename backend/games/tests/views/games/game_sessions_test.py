"""Tests for the game sessions create view (POST create)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession
from games.tests.factories import GameFactory, GameMasterFactory, SuperUserFactory, UserFactory


class TestGameSessionsCreateView(TestCase):
    """Tests for the POST /games/<slug>/sessions.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a superuser, and a regular user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game sessions list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/sessions.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_create_session(self):
        """Test that a DM of the game can create a session and receives 201."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_create_session(self):
        """Test that a superuser can create a session and receives 201."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.superuser_token)
        assert response.status_code == 201

    def test_create_returns_session_detail(self):
        """Test that the response body contains id, title, date, game_slug, and can_edit."""
        response = self._post(
            self.client, {'title': 'Session One', 'date': '2026-01-01'}, token=self.dm_token
        )
        data = json.loads(response.content)
        assert data['title'] == 'Session One'
        assert data['date'] == '2026-01-01'
        assert data['game_slug'] == 'test-game'
        assert data['can_edit'] is True
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post(self.client, {'title': 'Session One'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_title_returns_400(self):
        """Test that a POST without title returns 400."""
        response = self._post(self.client, {'date': '2026-01-01'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'title' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            self.client, {'title': 'Session One'}, token=self.dm_token, game_slug='unknown-game'
        )
        assert response.status_code == 404

    def test_created_session_persists_to_database(self):
        """Test that the created session is persisted and linked to the game."""
        self._post(self.client, {'title': 'Session One'}, token=self.dm_token)
        assert GameSession.objects.filter(game=self.game, title='Session One').exists()

    def test_create_with_description_persists_it(self):
        """Test that a description sent on creation is persisted and returned."""
        response = self._post(
            self.client, {'title': 'Session One', 'description': 'Some notes.'},
            token=self.dm_token,
        )
        data = json.loads(response.content)
        assert data['description'] == 'Some notes.'

    def test_get_is_not_allowed(self):
        """Test that GET on the create-only endpoint returns 405."""
        response = self.client.get('/games/test-game/sessions.json')
        assert response.status_code == 405

    def test_url_by_name_accepts_post(self):
        """Test that the create endpoint is reachable via its URL name."""
        url = reverse('game-sessions-list', kwargs={'game_slug': 'test-game'})
        response = self._post(self.client, {'title': 'Session One'}, token=self.dm_token)
        assert url == '/games/test-game/sessions.json'
        assert response.status_code == 201
