"""Tests for the CharacterItemPhoto model."""

from django.test import TestCase

from games.models import CharacterItemPhoto
from games.tests.factories import CharacterItemFactory


class TestCharacterItemPhoto(TestCase):
    """Tests for the CharacterItemPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.character_item = CharacterItemFactory()

    def test_character_item_photo_creation(self):
        """Test that a character item photo can be created and linked to a character item."""
        photo = CharacterItemPhoto.objects.create(
            path='photos/character_items/1/photo.png', character_item=self.character_item,
        )
        assert photo.path == 'photos/character_items/1/photo.png'
        assert photo.character_item == self.character_item

    def test_character_item_photo_str(self):
        """Test string representation of a character item photo."""
        photo = CharacterItemPhoto(
            path='photos/character_items/1/photo.jpg', character_item=self.character_item,
        )
        assert str(photo) == 'photos/character_items/1/photo.jpg'

    def test_character_item_photos_related_name(self):
        """Test that photos can be accessed via the character item's related name."""
        CharacterItemPhoto.objects.create(
            path='photos/character_items/1/photo1.png', character_item=self.character_item,
        )
        CharacterItemPhoto.objects.create(
            path='photos/character_items/1/photo2.png', character_item=self.character_item,
        )
        assert self.character_item.photos.count() == 2

    def test_deleting_photo_clears_character_item_photo(self):
        """Test that deleting a character item's photo sets CharacterItem.photo back to None."""
        photo = CharacterItemPhoto.objects.create(
            path='photos/character_items/1/photo.png', character_item=self.character_item,
        )
        self.character_item.photo = photo
        self.character_item.save()

        photo.delete()

        self.character_item.refresh_from_db()
        assert self.character_item.photo is None
