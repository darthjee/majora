"""Tests for the GameSessionCreateSerializer."""

from django.test import TestCase

from games.serializers import GameSessionCreateSerializer
from games.tests.factories import GameFactory


class TestGameSessionCreateSerializer(TestCase):
    """Tests for the GameSessionCreateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_valid_with_title_only(self):
        """Test that a payload with only title is valid."""
        serializer = GameSessionCreateSerializer(data={'title': 'Session One'})
        assert serializer.is_valid()

    def test_valid_with_title_and_date(self):
        """Test that a payload with title and date is valid."""
        serializer = GameSessionCreateSerializer(
            data={'title': 'Session One', 'date': '2026-01-01'}
        )
        assert serializer.is_valid()

    def test_valid_with_description(self):
        """Test that a payload with a description is valid."""
        serializer = GameSessionCreateSerializer(
            data={'title': 'Session One', 'description': 'Some notes.'}
        )
        assert serializer.is_valid()

    def test_valid_without_description(self):
        """Test that a payload without a description is still valid."""
        serializer = GameSessionCreateSerializer(data={'title': 'Session One'})
        assert serializer.is_valid()

    def test_saves_description(self):
        """Test that a valid description is persisted on save."""
        serializer = GameSessionCreateSerializer(
            data={'title': 'Session One', 'description': 'Some notes.'}
        )
        assert serializer.is_valid()
        session = serializer.save(game=self.game)
        assert session.description == 'Some notes.'

    def test_invalid_without_title(self):
        """Test that a payload without title is invalid."""
        serializer = GameSessionCreateSerializer(data={'date': '2026-01-01'})
        assert not serializer.is_valid()
        assert 'title' in serializer.errors

    def test_game_is_set_explicitly_in_view(self):
        """Test that game is not accepted from the payload and must be passed to save()."""
        serializer = GameSessionCreateSerializer(data={'title': 'Session One'})
        assert serializer.is_valid()
        session = serializer.save(game=self.game)
        assert session.game == self.game

    def test_does_not_include_game_field(self):
        """Test that game is not a field accepted by the serializer."""
        serializer = GameSessionCreateSerializer(
            data={'title': 'Session One', 'game': self.game.id}
        )
        assert serializer.is_valid()
        assert 'game' not in serializer.validated_data
