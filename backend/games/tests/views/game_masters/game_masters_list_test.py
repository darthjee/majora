"""Tests for the game masters list view (GET list / POST create)."""

import json

from django.test import TestCase
from rest_framework.authtoken.models import Token

from games.models import GameMaster
from games.tests.factories import GameFactory, GameMasterFactory, UserFactory


class TestGameMastersListView(TestCase):
    """Tests for the game masters list endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.user = UserFactory(username='dm_user', password='secret-password')

    def _get(self, client, game_slug=None):
        url = f'/games/{game_slug or self.game.game_slug}/game-masters.json'
        return client.get(url)

    def _post(self, client, token=None, game_slug=None):
        url = f'/games/{game_slug or self.game.game_slug}/game-masters.json'
        headers = {'HTTP_AUTHORIZATION': f'Token {token}'} if token else {}
        return client.post(url, content_type='application/json', **headers)

    def test_get_returns_empty_list(self):
        """Test that an empty list is returned when no game masters exist."""
        response = self._get(self.client)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_get_returns_game_masters(self):
        """Test that existing game masters are returned."""
        GameMasterFactory(game=self.game, user=self.user)
        response = self._get(self.client)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['user'] == self.user.id

    def test_get_returns_404_for_unknown_game(self):
        """Test that 404 is returned for an unknown game slug."""
        response = self._get(self.client, game_slug='unknown-game')
        assert response.status_code == 404

    def test_post_requires_authentication(self):
        """Test that POST returns 401 when unauthenticated."""
        response = self._post(self.client)
        assert response.status_code == 401

    def test_post_creates_game_master(self):
        """Test that POST creates a new game master assignment."""
        token = Token.objects.create(user=self.user)
        response = self._post(self.client, token=token)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['user'] == self.user.id
        assert GameMaster.objects.filter(game=self.game, user=self.user).exists()

    def test_post_returns_400_when_already_game_master(self):
        """Test that POST returns 400 when user is already a game master."""
        GameMasterFactory(game=self.game, user=self.user)
        token = Token.objects.create(user=self.user)
        response = self._post(self.client, token=token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_post_returns_404_for_unknown_game(self):
        """Test that POST returns 404 for an unknown game slug."""
        token = Token.objects.create(user=self.user)
        response = self._post(self.client, token=token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_post_creates_game_master_via_session_cookie(self):
        """Test that POST creates a game master for a cookie-authenticated user."""
        Token.objects.create(user=self.user)
        session = self.client.session
        session['auth_token'] = Token.objects.get(user=self.user).key
        session.save()
        url = f'/games/{self.game.game_slug}/game-masters.json'
        response = self.client.post(url, content_type='application/json')
        assert response.status_code == 201
        assert GameMaster.objects.filter(game=self.game, user=self.user).exists()
