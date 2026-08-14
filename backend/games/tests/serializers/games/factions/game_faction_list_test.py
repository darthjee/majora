"""Tests for the GameFactionListSerializer."""

from django.test import TestCase

from games.models import GameFactionPhoto
from games.serializers import GameFactionListSerializer
from games.tests.factories import GameFactionFactory


class TestGameFactionListSerializer(TestCase):
    """Tests for the GameFactionListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.faction = GameFactionFactory(name='The Silver Hand')

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameFactionListSerializer(self.faction).data
        assert data['id'] == self.faction.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameFactionListSerializer(self.faction).data
        assert data['name'] == 'The Silver Hand'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameFactionListSerializer(self.faction).data
        assert set(data.keys()) == {'id', 'name', 'photo_path'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the faction has no photo."""
        data = GameFactionListSerializer(self.faction).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a GameFactionPhoto is attached."""
        photo = GameFactionPhoto.objects.create(
            faction=self.faction, path='photos/factions/1/photo.png',
        )
        self.faction.photo = photo
        self.faction.save()
        data = GameFactionListSerializer(self.faction).data
        assert data['photo_path'] == 'photos/factions/1/photo.png'
