"""Tests for the GameItemPhoto model."""

from django.test import TestCase

from games.models import GameItemPhoto
from games.tests.factories import GameItemFactory


class TestGameItemPhoto(TestCase):
    """Tests for the GameItemPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.item = GameItemFactory(name='Cloak of Elvenkind')

    def test_game_item_photo_creation(self):
        """Test that a game item photo can be created and linked to a game item."""
        photo = GameItemPhoto.objects.create(
            path='photos/game_items/1/photo.png', game_item=self.item,
        )
        assert photo.path == 'photos/game_items/1/photo.png'
        assert photo.game_item == self.item

    def test_game_item_photo_str(self):
        """Test string representation of a game item photo."""
        photo = GameItemPhoto(path='photos/game_items/1/photo.jpg', game_item=self.item)
        assert str(photo) == 'photos/game_items/1/photo.jpg'

    def test_game_item_photos_related_name(self):
        """Test that photos can be accessed via the game item's related name."""
        GameItemPhoto.objects.create(path='photos/game_items/1/photo1.png', game_item=self.item)
        GameItemPhoto.objects.create(path='photos/game_items/1/photo2.png', game_item=self.item)
        assert self.item.photos.count() == 2

    def test_deleting_photo_clears_game_item_photo(self):
        """Test that deleting a game item's photo sets GameItem.photo back to None."""
        photo = GameItemPhoto.objects.create(
            path='photos/game_items/1/photo.png', game_item=self.item,
        )
        self.item.photo = photo
        self.item.save()

        photo.delete()

        self.item.refresh_from_db()
        assert self.item.photo is None
