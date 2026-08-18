"""Tests for the GameCommonItemUpdateSerializer."""

from django.test import TestCase

from games.models import GameCommonItem
from games.serializers import GameCommonItemUpdateSerializer
from games.tests.factories import GameCommonItemFactory, GameFactory


class TestGameCommonItemUpdateSerializer(TestCase):
    """Tests for GameCommonItemUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game common item instance for testing."""
        cls.common_item = GameCommonItemFactory(
            name='Healing Potion', description='A cheap tonic.', price=10, hidden=False,
        )

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'name': 'Greater Healing Potion'}, partial=True,
        )
        assert serializer.is_valid()
        common_item = serializer.save()
        assert common_item.name == 'Greater Healing Potion'

    def test_valid_partial_description_update(self):
        """Test that a partial update with only description is valid."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'description': 'A finer tonic.'}, partial=True,
        )
        assert serializer.is_valid()
        common_item = serializer.save()
        assert common_item.description == 'A finer tonic.'

    def test_valid_partial_price_update(self):
        """Test that a partial update with only price is valid."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'price': 25}, partial=True,
        )
        assert serializer.is_valid()
        common_item = serializer.save()
        assert common_item.price == 25

    def test_valid_partial_category_update(self):
        """Test that a partial update with only category is valid."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'category': GameCommonItem.CATEGORY_POTION}, partial=True,
        )
        assert serializer.is_valid()
        common_item = serializer.save()
        assert common_item.category == GameCommonItem.CATEGORY_POTION

    def test_valid_partial_hidden_update(self):
        """Test that a partial update with only hidden leaves other fields untouched."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'hidden': True}, partial=True,
        )
        assert serializer.is_valid()
        common_item = serializer.save()
        assert common_item.hidden is True
        assert common_item.name == 'Healing Potion'
        assert common_item.description == 'A cheap tonic.'
        assert common_item.price == 10

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GameCommonItemUpdateSerializer(self.common_item, data={}, partial=True)
        assert serializer.is_valid()

    def test_blank_name_is_rejected(self):
        """Test that a blank name is rejected — GameCommonItem has no fallback target."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'name': ''}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_invalid_name_too_long(self):
        """Test that a name exceeding max_length is rejected."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'name': 'x' * 201}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_negative_price_is_rejected(self):
        """Test that a negative price is rejected."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'price': -1}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'price' in serializer.errors

    def test_invalid_category_is_rejected(self):
        """Test that an unrecognized category is rejected."""
        serializer = GameCommonItemUpdateSerializer(
            self.common_item, data={'category': 'not-a-category'}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'category' in serializer.errors

    def test_game_and_id_are_not_included(self):
        """Test that game and id are not fields in the serializer."""
        other_game = GameFactory()
        original_game_id = self.common_item.game_id
        serializer = GameCommonItemUpdateSerializer(
            self.common_item,
            data={'name': 'New Name', 'game': other_game.id, 'id': 999},
            partial=True,
        )
        assert serializer.is_valid()
        common_item = serializer.save()
        assert common_item.name == 'New Name'
        assert common_item.game_id == original_game_id
        assert common_item.id != 999
