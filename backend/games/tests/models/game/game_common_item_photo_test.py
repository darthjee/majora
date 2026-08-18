"""Tests for the GameCommonItemPhoto model."""

from django.test import TestCase

from games.models import GameCommonItemPhoto
from games.tests.factories import GameCommonItemFactory


class TestGameCommonItemPhoto(TestCase):
    """Tests for the GameCommonItemPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.common_item = GameCommonItemFactory(name='Healing Potion')

    def test_game_common_item_photo_creation(self):
        """Test that a game common item photo can be created and linked to a common item."""
        photo = GameCommonItemPhoto.objects.create(
            path='photos/game_common_items/1/photo.png', game_common_item=self.common_item,
        )
        assert photo.path == 'photos/game_common_items/1/photo.png'
        assert photo.game_common_item == self.common_item

    def test_game_common_item_photo_str(self):
        """Test string representation of a game common item photo."""
        photo = GameCommonItemPhoto(
            path='photos/game_common_items/1/photo.jpg', game_common_item=self.common_item,
        )
        assert str(photo) == 'photos/game_common_items/1/photo.jpg'

    def test_game_common_item_photos_related_name(self):
        """Test that photos can be accessed via the game common item's related name."""
        GameCommonItemPhoto.objects.create(
            path='photos/game_common_items/1/photo1.png', game_common_item=self.common_item,
        )
        GameCommonItemPhoto.objects.create(
            path='photos/game_common_items/1/photo2.png', game_common_item=self.common_item,
        )
        assert self.common_item.photos.count() == 2

    def test_deleting_photo_clears_game_common_item_photo(self):
        """Test that deleting a game common item's photo sets GameCommonItem.photo back to None."""
        photo = GameCommonItemPhoto.objects.create(
            path='photos/game_common_items/1/photo.png', game_common_item=self.common_item,
        )
        self.common_item.photo = photo
        self.common_item.save()

        photo.delete()

        self.common_item.refresh_from_db()
        assert self.common_item.photo is None
