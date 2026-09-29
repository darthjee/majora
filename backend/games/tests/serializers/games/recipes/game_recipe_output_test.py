"""Tests for the GameRecipeOutputSerializer."""

from django.test import TestCase

from games.models import GameCommonItem, GameCommonItemPhoto
from games.serializers import GameRecipeOutputSerializer
from games.tests.factories import GameCommonItemFactory


class TestGameRecipeOutputSerializer(TestCase):
    """Tests for the GameRecipeOutputSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.common_item = GameCommonItemFactory(
            name='Healing Potion', category=GameCommonItem.CATEGORY_POTION,
        )

    def test_only_exposes_expected_fields(self):
        """Test that only the documented output fields are exposed."""
        data = GameRecipeOutputSerializer(self.common_item).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'category'}

    def test_serializes_values(self):
        """Test that id, name and category are serialized from the common item."""
        data = GameRecipeOutputSerializer(self.common_item).data
        assert data['id'] == self.common_item.id
        assert data['name'] == 'Healing Potion'
        assert data['category'] == GameCommonItem.CATEGORY_POTION

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the common item has no photo."""
        data = GameRecipeOutputSerializer(self.common_item).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the common item's photo path once one is attached."""
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=self.common_item, path='photos/game_common_items/1/photo.png',
        )
        self.common_item.photo = photo
        self.common_item.save()
        data = GameRecipeOutputSerializer(self.common_item).data
        assert data['photo_path'] == 'photos/game_common_items/1/photo.png'
