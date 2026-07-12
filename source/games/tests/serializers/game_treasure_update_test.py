"""Tests for the GameTreasureUpdateSerializer."""

from django.test import TestCase

from games.models import GameTreasure
from games.serializers import GameTreasureUpdateSerializer
from games.tests.factories import GameFactory, TreasureFactory


class TestGameTreasureUpdateSerializer(TestCase):
    """Tests for GameTreasureUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game treasure instance for testing."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.treasure = TreasureFactory(name='Golden Crown', value=500)
        cls.game_treasure = GameTreasure.objects.create(game=cls.game, treasure=cls.treasure)

    def test_valid_max_units_update(self):
        """Test that a partial update with a max_units integer is valid and persisted."""
        serializer = GameTreasureUpdateSerializer(
            self.game_treasure, data={'max_units': 10}, partial=True,
        )
        assert serializer.is_valid()
        game_treasure = serializer.save()
        assert game_treasure.max_units == 10

    def test_max_units_can_be_set_to_null(self):
        """Test that max_units can be cleared back to null (unlimited)."""
        self.game_treasure.max_units = 10
        self.game_treasure.save()
        serializer = GameTreasureUpdateSerializer(
            self.game_treasure, data={'max_units': None}, partial=True,
        )
        assert serializer.is_valid()
        game_treasure = serializer.save()
        assert game_treasure.max_units is None

    def test_negative_max_units_is_rejected(self):
        """Test that a negative max_units fails validation."""
        serializer = GameTreasureUpdateSerializer(
            self.game_treasure, data={'max_units': -1}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'max_units' in serializer.errors

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (max_units is optional)."""
        serializer = GameTreasureUpdateSerializer(self.game_treasure, data={}, partial=True)
        assert serializer.is_valid()

    def test_acquired_units_is_not_included(self):
        """Test that acquired_units is not a field in the serializer and cannot be changed."""
        serializer = GameTreasureUpdateSerializer(
            self.game_treasure, data={'max_units': 10, 'acquired_units': 999}, partial=True,
        )
        assert serializer.is_valid()
        game_treasure = serializer.save()
        assert game_treasure.max_units == 10
        assert game_treasure.acquired_units == 0
