"""Tests for the TreasurePhoto model."""

import pytest

from games.models import TreasurePhoto
from games.tests.factories import TreasureFactory


@pytest.mark.django_db
class TestTreasurePhoto:
    """Tests for the TreasurePhoto model."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.treasure = TreasureFactory(name='Golden Crown', value=500)

    def test_treasure_photo_creation(self):
        """Test that a treasure photo can be created and linked to a treasure."""
        photo = TreasurePhoto.objects.create(
            path='photos/treasures/1/photo.png', treasure=self.treasure
        )
        assert photo.path == 'photos/treasures/1/photo.png'
        assert photo.treasure == self.treasure

    def test_treasure_photo_str(self):
        """Test string representation of a treasure photo."""
        photo = TreasurePhoto(path='photos/treasures/1/photo.jpg', treasure=self.treasure)
        assert str(photo) == 'photos/treasures/1/photo.jpg'

    def test_treasure_photos_related_name(self):
        """Test that photos can be accessed via the treasure's related name."""
        TreasurePhoto.objects.create(path='photos/treasures/1/photo1.png', treasure=self.treasure)
        TreasurePhoto.objects.create(path='photos/treasures/1/photo2.png', treasure=self.treasure)
        assert self.treasure.photos.count() == 2

    def test_deleting_photo_clears_treasure_photo(self):
        """Test that deleting a treasure's photo sets Treasure.photo back to None."""
        photo = TreasurePhoto.objects.create(
            path='photos/treasures/1/photo.png', treasure=self.treasure
        )
        self.treasure.photo = photo
        self.treasure.save()

        photo.delete()

        self.treasure.refresh_from_db()
        assert self.treasure.photo is None
