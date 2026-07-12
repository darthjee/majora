"""Tests for the GameSessionListSerializer."""

import pytest

from games.models import GameSession
from games.serializers import GameSessionListSerializer
from games.tests.factories import GameFactory


@pytest.mark.django_db
class TestGameSessionListSerializer:
    """Tests for the GameSessionListSerializer."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.session = GameSession.objects.create(game=self.game, title='Session One')

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameSessionListSerializer(self.session).data
        assert data['id'] == self.session.id

    def test_serializes_title(self):
        """Test that the title field is serialized."""
        data = GameSessionListSerializer(self.session).data
        assert data['title'] == 'Session One'

    def test_serializes_date_as_none_when_unset(self):
        """Test that date is null when the session has no date."""
        data = GameSessionListSerializer(self.session).data
        assert data['date'] is None

    def test_serializes_date_when_set(self):
        """Test that date is serialized when set."""
        self.session.date = '2026-01-01'
        self.session.save()
        data = GameSessionListSerializer(self.session).data
        assert data['date'] == '2026-01-01'

    def test_serializes_game_slug(self):
        """Test that the game_slug field is sourced from the related game."""
        data = GameSessionListSerializer(self.session).data
        assert data['game_slug'] == 'test-game'

    def test_only_exposes_expected_fields(self):
        """Test that only id, title, date, and game_slug are exposed."""
        data = GameSessionListSerializer(self.session).data
        assert set(data.keys()) == {'id', 'title', 'date', 'game_slug'}
