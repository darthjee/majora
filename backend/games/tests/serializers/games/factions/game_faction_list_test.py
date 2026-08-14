"""Tests for the FactionListSerializer."""

from django.test import TestCase

from games.models import FactionPhoto
from games.serializers import FactionListSerializer
from games.tests.factories import FactionFactory


class TestFactionListSerializer(TestCase):
    """Tests for the FactionListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.faction = FactionFactory(name='The Silver Hand')

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = FactionListSerializer(self.faction).data
        assert data['id'] == self.faction.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = FactionListSerializer(self.faction).data
        assert data['name'] == 'The Silver Hand'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = FactionListSerializer(self.faction).data
        assert set(data.keys()) == {'id', 'name', 'photo_path'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the faction has no photo."""
        data = FactionListSerializer(self.faction).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a FactionPhoto is attached."""
        photo = FactionPhoto.objects.create(
            faction=self.faction, path='photos/factions/1/photo.png',
        )
        self.faction.photo = photo
        self.faction.save()
        data = FactionListSerializer(self.faction).data
        assert data['photo_path'] == 'photos/factions/1/photo.png'
