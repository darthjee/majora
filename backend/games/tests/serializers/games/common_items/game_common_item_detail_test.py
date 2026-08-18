"""Tests for the GameCommonItemDetailSerializer/GameCommonItemDetailFullSerializer."""

from django.test import TestCase

from games.serializers import (
    GameCommonItemDetailFullSerializer,
    GameCommonItemDetailSerializer,
)
from games.tests.factories import GameCommonItemFactory


class TestGameCommonItemDetailSerializer(TestCase):
    """Tests for the GameCommonItemDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.common_item = GameCommonItemFactory(
            name='Healing Potion', description='Restores a small amount of health.',
        )

    def test_serializes_description(self):
        """Test that the description field is serialized."""
        data = GameCommonItemDetailSerializer(self.common_item).data
        assert data['description'] == 'Restores a small amount of health.'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameCommonItemDetailSerializer(self.common_item).data
        assert set(data.keys()) == {
            'id', 'name', 'description', 'photo_path', 'price', 'category',
        }


class TestGameCommonItemDetailFullSerializer(TestCase):
    """Tests for the GameCommonItemDetailFullSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.common_item = GameCommonItemFactory(
            name='Healing Potion', description='Restores a small amount of health.',
        )

    def test_includes_hidden_field_alongside_detail_fields(self):
        """Test that the serializer exposes every GameCommonItemDetailSerializer field."""
        data = GameCommonItemDetailFullSerializer(self.common_item).data
        assert set(data.keys()) == {
            'id', 'name', 'description', 'photo_path', 'price', 'category', 'hidden',
        }

    def test_hidden_reflects_the_game_common_item_own_field(self):
        """Test that hidden reflects the game common item's own hidden field."""
        self.common_item.hidden = True
        self.common_item.save()
        data = GameCommonItemDetailFullSerializer(self.common_item).data
        assert data['hidden'] is True
