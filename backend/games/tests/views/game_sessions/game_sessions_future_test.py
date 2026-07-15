"""Tests for the game sessions future view (GET future)."""

import datetime
import json

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from games.models import GameSession
from games.tests.factories import GameFactory


class TestGameSessionsFutureView(TestCase):
    """Tests for the GET /games/<slug>/sessions/future.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and some past/future sessions for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.today = timezone.now().date()

    def test_returns_empty_list_when_no_future_sessions(self):
        """Test that an empty list is returned when the game has no future sessions."""
        response = self.client.get('/games/test-game/sessions/future.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_includes_today_session(self):
        """Test that a session dated today is included."""
        GameSession.objects.create(game=self.game, title='Today', date=self.today)
        response = self.client.get('/games/test-game/sessions/future.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['title'] == 'Today'

    def test_excludes_past_sessions(self):
        """Test that sessions dated before today are excluded."""
        GameSession.objects.create(
            game=self.game, title='Past', date=self.today - datetime.timedelta(days=1)
        )
        response = self.client.get('/games/test-game/sessions/future.json')
        assert json.loads(response.content) == []

    def test_excludes_unscheduled_sessions(self):
        """Test that sessions without a date are excluded."""
        GameSession.objects.create(game=self.game, title='Unscheduled')
        response = self.client.get('/games/test-game/sessions/future.json')
        assert json.loads(response.content) == []

    def test_returns_only_this_games_future_sessions(self):
        """Test that only future sessions belonging to the requested game are returned."""
        GameSession.objects.create(
            game=self.game, title='Mine', date=self.today + datetime.timedelta(days=1)
        )
        GameSession.objects.create(
            game=self.other_game, title='Other', date=self.today + datetime.timedelta(days=1)
        )
        response = self.client.get('/games/test-game/sessions/future.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['title'] == 'Mine'

    def test_orders_soonest_first(self):
        """Test that future sessions are ordered soonest first."""
        later = GameSession.objects.create(
            game=self.game, title='Later', date=self.today + datetime.timedelta(days=10)
        )
        soonest = GameSession.objects.create(
            game=self.game, title='Soonest', date=self.today + datetime.timedelta(days=1)
        )
        response = self.client.get('/games/test-game/sessions/future.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [soonest.id, later.id]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/sessions/future.json')
        assert response.status_code == 404

    def test_response_includes_pagination_headers(self):
        """Test that the response includes the page/pages/per_page/total headers."""
        GameSession.objects.create(
            game=self.game, title='Future', date=self.today + datetime.timedelta(days=1)
        )
        response = self.client.get('/games/test-game/sessions/future.json')
        assert response['page'] == '1'
        assert response['pages'] == '1'
        assert 'per_page' in response
        assert response['total'] == '1'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            GameSession.objects.create(
                game=self.game, title=f'Session {i}',
                date=self.today + datetime.timedelta(days=i + 1),
            )
        response = self.client.get('/games/test-game/sessions/future.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-sessions-future', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200
