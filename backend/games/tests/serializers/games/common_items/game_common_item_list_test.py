"""Tests for the GameCommonItemListSerializer/GameCommonItemAllListSerializer."""

from django.test import TestCase

from games.models import GameCommonItem, GameCommonItemPhoto
from games.serializers import GameCommonItemAllListSerializer, GameCommonItemListSerializer
from games.tests.factories import GameCommonItemFactory


class TestGameCommonItemListSerializer(TestCase):
    """Tests for the GameCommonItemListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.common_item = GameCommonItemFactory(
            name='Healing Potion', description='Restores a small amount of health.', price=15,
            category=GameCommonItem.CATEGORY_POTION,
        )

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert data['id'] == self.common_item.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert data['name'] == 'Healing Potion'

    def test_serializes_price(self):
        """Test that the price field is serialized."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert data['price'] == 15

    def test_serializes_category(self):
        """Test that the category field is serialized."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert data['category'] == GameCommonItem.CATEGORY_POTION

    def test_does_not_include_description(self):
        """Test that description is not exposed by the index serializer."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert 'description' not in data

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'price', 'category'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the game common item has no photo."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a GameCommonItemPhoto is attached."""
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=self.common_item, path='photos/game_common_items/1/photo.png',
        )
        self.common_item.photo = photo
        self.common_item.save()
        data = GameCommonItemListSerializer(self.common_item).data
        assert data['photo_path'] == 'photos/game_common_items/1/photo.png'

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = GameCommonItemListSerializer(self.common_item).data
        assert 'hidden' not in data


class TestGameCommonItemAllListSerializer(TestCase):
    """Tests for the GameCommonItemAllListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.common_item = GameCommonItemFactory(name='Healing Potion')

    def test_includes_hidden_field_alongside_list_fields(self):
        """Test that the serializer exposes every GameCommonItemListSerializer field plus hidden."""
        data = GameCommonItemAllListSerializer(self.common_item).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'price', 'category', 'hidden'}

    def test_hidden_reflects_the_game_common_item_own_field(self):
        """Test that hidden reflects the game common item's own hidden field."""
        self.common_item.hidden = True
        self.common_item.save()
        data = GameCommonItemAllListSerializer(self.common_item).data
        assert data['hidden'] is True
