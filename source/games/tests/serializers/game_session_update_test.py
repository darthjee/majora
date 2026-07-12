"""Tests for the GameSessionUpdateSerializer."""

import pytest

from games.models import GameSession
from games.serializers import GameSessionUpdateSerializer
from games.tests.factories import GameFactory


@pytest.mark.django_db
class TestGameSessionUpdateSerializer:
    """Tests for GameSessionUpdateSerializer."""

    def setup_method(self):
        """Set up a session instance for testing."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.session = GameSession.objects.create(game=self.game, title='Session One')

    def test_valid_partial_title_update(self):
        """Test that a partial update with only title is valid."""
        serializer = GameSessionUpdateSerializer(
            self.session, data={'title': 'Session Two'}, partial=True
        )
        assert serializer.is_valid()
        session = serializer.save()
        assert session.title == 'Session Two'

    def test_valid_partial_date_update(self):
        """Test that a partial update with only date is valid."""
        serializer = GameSessionUpdateSerializer(
            self.session, data={'date': '2026-01-01'}, partial=True
        )
        assert serializer.is_valid()
        session = serializer.save()
        assert str(session.date) == '2026-01-01'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GameSessionUpdateSerializer(self.session, data={}, partial=True)
        assert serializer.is_valid()

    def test_does_not_include_game(self):
        """Test that the game field is not exposed."""
        data = GameSessionUpdateSerializer(self.session).data
        assert 'game' not in data

    def test_game_is_not_changed_via_update(self):
        """Test that game cannot be reassigned via the update payload, even if supplied."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        serializer = GameSessionUpdateSerializer(
            self.session,
            data={'title': 'Session Two', 'game': other_game.id, 'game_id': other_game.id},
            partial=True,
        )
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.title == 'Session Two'
        assert updated.game == self.game
