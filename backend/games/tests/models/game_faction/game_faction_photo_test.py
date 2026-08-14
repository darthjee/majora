"""Tests for the FactionPhoto model."""

from django.test import TestCase

from games.models import FactionPhoto
from games.tests.factories import FactionFactory


class TestFactionPhoto(TestCase):
    """Tests for the FactionPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.faction = FactionFactory(name='The Silver Hand')

    def test_faction_photo_creation(self):
        """Test that a faction photo can be created and linked to a faction."""
        photo = FactionPhoto.objects.create(
            path='photos/factions/1/photo.png', faction=self.faction,
        )
        assert photo.path == 'photos/factions/1/photo.png'
        assert photo.faction == self.faction

    def test_faction_photo_str(self):
        """Test string representation of a faction photo."""
        photo = FactionPhoto(path='photos/factions/1/photo.jpg', faction=self.faction)
        assert str(photo) == 'photos/factions/1/photo.jpg'

    def test_faction_photos_related_name(self):
        """Test that photos can be accessed via the faction's related name."""
        FactionPhoto.objects.create(path='photos/factions/1/photo1.png', faction=self.faction)
        FactionPhoto.objects.create(path='photos/factions/1/photo2.png', faction=self.faction)
        assert self.faction.photos.count() == 2

    def test_deleting_photo_clears_faction_photo(self):
        """Test that deleting a faction's photo sets Faction.photo back to None."""
        photo = FactionPhoto.objects.create(
            path='photos/factions/1/photo.png', faction=self.faction,
        )
        self.faction.photo = photo
        self.faction.save()

        photo.delete()

        self.faction.refresh_from_db()
        assert self.faction.photo is None
