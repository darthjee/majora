"""Tests for the GameSessionPickSerializer."""

import datetime

from django.test import TestCase

from games.models import GameSession
from games.serializers import GameSessionPickSerializer
from games.tests.factories import GameFactory


class TestGameSessionPickSerializer(TestCase):
    """Tests for the GameSessionPickSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(
            game=cls.game, title='Session One', date=datetime.date(2026, 9, 30),
        )

    def test_serializes_id_name_title_and_date(self):
        """Test that id, name (the title), title and date are serialized."""
        data = GameSessionPickSerializer(self.session).data
        assert data == {
            'id': self.session.id,
            'name': 'Session One',
            'title': 'Session One',
            'date': '2026-09-30',
        }

    def test_serializes_null_date(self):
        """Test that a dateless session is serialized with a null date."""
        session = GameSession.objects.create(game=self.game, title='Unscheduled')
        assert GameSessionPickSerializer(session).data['date'] is None
