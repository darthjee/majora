"""Tests for the GameFactionPhoto model."""

from django.test import TestCase

from games.models import GameFactionPhoto
from games.tests.factories import GameFactionFactory


class TestGameFactionPhoto(TestCase):
    """Tests for the GameFactionPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.faction = GameFactionFactory(name='The Silver Hand')

    def test_faction_photo_creation(self):
        """Test that a faction photo can be created and linked to a faction."""
        photo = GameFactionPhoto.objects.create(
            path='photos/factions/1/photo.png', faction=self.faction,
        )
        assert photo.path == 'photos/factions/1/photo.png'
        assert photo.faction == self.faction

    def test_faction_photo_str(self):
        """Test string representation of a faction photo."""
        photo = GameFactionPhoto(path='photos/factions/1/photo.jpg', faction=self.faction)
        assert str(photo) == 'photos/factions/1/photo.jpg'

    def test_faction_photos_related_name(self):
        """Test that photos can be accessed via the faction's related name."""
        GameFactionPhoto.objects.create(path='photos/factions/1/photo1.png', faction=self.faction)
        GameFactionPhoto.objects.create(path='photos/factions/1/photo2.png', faction=self.faction)
        assert self.faction.photos.count() == 2

    def test_deleting_photo_clears_faction_photo(self):
        """Test that deleting a faction's photo sets GameFaction.photo back to None."""
        photo = GameFactionPhoto.objects.create(
            path='photos/factions/1/photo.png', faction=self.faction,
        )
        self.faction.photo = photo
        self.faction.save()

        photo.delete()

        self.faction.refresh_from_db()
        assert self.faction.photo is None
