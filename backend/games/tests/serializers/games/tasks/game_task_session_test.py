"""Tests for the GameTaskSessionSerializer."""

from django.test import TestCase

from games.models import GameSession
from games.serializers import GameTaskSessionSerializer
from games.tests.factories import GameFactory


class TestGameTaskSessionSerializer(TestCase):
    """Tests for the GameTaskSessionSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')

    def test_serializes_id_and_title_only(self):
        """Test that only the session's id and title are serialized."""
        data = GameTaskSessionSerializer(self.session).data
        assert data == {'id': self.session.id, 'title': 'Session One'}
