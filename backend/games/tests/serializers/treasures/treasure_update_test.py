"""Tests for the TreasureUpdateSerializer."""

from django.test import TestCase

from games.models import Game, Treasure
from games.serializers import TreasureUpdateSerializer


class TestTreasureUpdateSerializer(TestCase):
    """Tests for TreasureUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a treasure instance for testing."""
        cls.treasure = Treasure.objects.create(name='Golden Crown', value=500)

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

    def test_negative_value_is_rejected(self):
        """Test that a negative value fails validation."""
        serializer = TreasureUpdateSerializer(self.treasure, data={'value': -1}, partial=True)
        assert not serializer.is_valid()
        assert 'value' in serializer.errors

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

    def test_hidden_is_not_a_model_field_and_is_ignored(self):
        """Test that a `hidden` payload key is ignored (hidden lives on GameTreasure now)."""
        serializer = TreasureUpdateSerializer(self.treasure, data={'hidden': True}, partial=True)
        assert serializer.is_valid()
        treasure = serializer.save()
        assert not hasattr(treasure, 'hidden')

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
