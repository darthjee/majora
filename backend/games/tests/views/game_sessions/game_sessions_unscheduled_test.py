"""Tests for the game sessions unscheduled view (GET unscheduled)."""

import json

from django.test import TestCase
from django.urls import reverse

from games.models import GameSession
from games.tests.factories import GameFactory


class TestGameSessionsUnscheduledView(TestCase):
    """Tests for the GET /games/<slug>/sessions/unscheduled.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and another game for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_unscheduled_sessions(self):
        """Test that an empty list is returned when the game has no unscheduled sessions."""
        response = self.client.get('/games/test-game/sessions/unscheduled.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_excludes_dated_sessions(self):
        """Test that sessions with a date are excluded."""
        GameSession.objects.create(game=self.game, title='Dated', date='2026-01-01')
        response = self.client.get('/games/test-game/sessions/unscheduled.json')
        assert json.loads(response.content) == []

    def test_returns_only_this_games_unscheduled_sessions(self):
        """Test that only unscheduled sessions belonging to the requested game are returned."""
        GameSession.objects.create(game=self.game, title='Mine')
        GameSession.objects.create(game=self.other_game, title='Other')
        response = self.client.get('/games/test-game/sessions/unscheduled.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['title'] == 'Mine'

    def test_orders_by_id(self):
        """Test that unscheduled sessions are ordered by id (creation order)."""
        first = GameSession.objects.create(game=self.game, title='Zebra Session')
        second = GameSession.objects.create(game=self.game, title='Alpha Session')
        response = self.client.get('/games/test-game/sessions/unscheduled.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/sessions/unscheduled.json')
        assert response.status_code == 404

    def test_response_includes_pagination_headers(self):
        """Test that the response includes the page/pages/per_page/total headers."""
        GameSession.objects.create(game=self.game, title='Unscheduled')
        response = self.client.get('/games/test-game/sessions/unscheduled.json')
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '1'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            GameSession.objects.create(game=self.game, title=f'Session {i}')
        response = self.client.get('/games/test-game/sessions/unscheduled.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-sessions-unscheduled', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200
