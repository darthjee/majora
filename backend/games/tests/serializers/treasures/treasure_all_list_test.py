"""Tests for the TreasureAllListSerializer."""

from django.test import TestCase

from games.models import GameTreasure
from games.serializers import TreasureAllListSerializer
from games.tests.factories import GameFactory, GameTreasureFactory, TreasureFactory


class TestTreasureAllListSerializer(TestCase):
    """Tests for the TreasureAllListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.treasure = TreasureFactory(name='Golden Crown', value=500, game=cls.game)

    def test_includes_hidden_field_alongside_list_fields(self):
        """Test that the serializer exposes every TreasureListSerializer field plus hidden."""
        data = TreasureAllListSerializer(self.treasure, context={'game': self.game}).data
        assert set(data.keys()) == {
            'id', 'name', 'value', 'game_type', 'photo_path', 'game_slug', 'available_units',
            'max_units', 'hidden',
        }

    def test_hidden_defaults_to_false_without_game_treasure_row(self):
        """Test that hidden is False when no GameTreasure row exists for the context game."""
        data = TreasureAllListSerializer(self.treasure, context={'game': self.game}).data
        assert data['hidden'] is False

    def test_hidden_reflects_the_game_treasure_row(self):
        """Test that hidden reflects the context game's GameTreasure row."""
        GameTreasureFactory(
            game=self.game, treasure=self.treasure, value=self.treasure.value, hidden=True,
        )
        data = TreasureAllListSerializer(self.treasure, context={'game': self.game}).data
        assert data['hidden'] is True

    def test_hidden_defaults_to_false_without_game_context(self):
        """Test that hidden is False when there is no game in context at all."""
        data = TreasureAllListSerializer(self.treasure).data
        assert data['hidden'] is False

    def test_hidden_uses_prefetched_game_treasures_map_when_provided(self):
        """Test that hidden uses a prefetched game_treasures_by_treasure_id map over a query."""
        game_treasure = GameTreasureFactory(
            game=self.game, treasure=self.treasure, value=self.treasure.value, hidden=True,
        )
        context = {
            'game': self.game,
            'game_treasures_by_treasure_id': {self.treasure.id: game_treasure},
        }
        data = TreasureAllListSerializer(self.treasure, context=context).data
        assert data['hidden'] is True

    def test_hidden_scoped_to_a_different_game_stays_false(self):
        """Test that a GameTreasure row for another game does not leak into this game's hidden."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_treasure = TreasureFactory(name='Shared Gem', value=100)
        GameTreasure.objects.create(
            game=other_game, treasure=other_treasure, value=100, hidden=True,
        )
        data = TreasureAllListSerializer(other_treasure, context={'game': self.game}).data
        assert data['hidden'] is False
