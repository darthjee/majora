"""Tests for the TreasureUpdateSerializer."""

import pytest

from games.models import Game, Treasure
from games.serializers import TreasureUpdateSerializer


@pytest.mark.django_db
class TestTreasureUpdateSerializer:
    """Tests for TreasureUpdateSerializer."""

    def setup_method(self):
        """Set up a treasure instance for testing."""
        self.treasure = Treasure.objects.create(name='Golden Crown', value=500)

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = TreasureUpdateSerializer(
            self.treasure, data={'name': 'Silver Crown'}, partial=True
        )
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.name == 'Silver Crown'

    def test_valid_partial_value_update(self):
        """Test that a partial update with only value is valid."""
        serializer = TreasureUpdateSerializer(self.treasure, data={'value': 750}, partial=True)
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.value == 750

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = TreasureUpdateSerializer(self.treasure, data={}, partial=True)
        assert serializer.is_valid()

    def test_id_is_not_included(self):
        """Test that id is not a field in the serializer and cannot be changed."""
        original_id = self.treasure.id
        serializer = TreasureUpdateSerializer(
            self.treasure,
            data={'name': 'Silver Crown', 'id': original_id + 1000},
            partial=True,
        )
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.name == 'Silver Crown'
        assert treasure.id == original_id

    def test_game_is_not_included(self):
        """Test that game is not a field in the serializer and cannot be reassigned."""
        other_game = Game.objects.create(name='Other Game', game_slug='other-game')
        serializer = TreasureUpdateSerializer(
            self.treasure,
            data={'name': 'Silver Crown', 'value': 750, 'game': other_game.id},
            partial=True,
        )
        assert serializer.is_valid()
        treasure = serializer.save()
        assert treasure.name == 'Silver Crown'
        assert treasure.value == 750
        assert treasure.game is None
