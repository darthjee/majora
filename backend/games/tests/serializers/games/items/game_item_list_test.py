"""Tests for the GameItemListSerializer/GameItemAllListSerializer."""

from django.test import TestCase

from games.models import GameItemPhoto
from games.serializers import GameItemAllListSerializer, GameItemListSerializer
from games.tests.factories import GameItemFactory


class TestGameItemListSerializer(TestCase):
    """Tests for the GameItemListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.item = GameItemFactory(name='Cloak of Elvenkind', description='A shimmering cloak.')

    def test_serializes_id(self):
        """Test that the id field is serialized."""
        data = GameItemListSerializer(self.item).data
        assert data['id'] == self.item.id

    def test_serializes_name(self):
        """Test that the name field is serialized."""
        data = GameItemListSerializer(self.item).data
        assert data['name'] == 'Cloak of Elvenkind'

    def test_does_not_include_description(self):
        """Test that description is not exposed by the index serializer."""
        data = GameItemListSerializer(self.item).data
        assert 'description' not in data

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameItemListSerializer(self.item).data
        assert set(data.keys()) == {'id', 'name', 'photo_path'}

    def test_photo_path_is_none_without_photo(self):
        """Test that photo_path is None when the game item has no photo."""
        data = GameItemListSerializer(self.item).data
        assert data['photo_path'] is None

    def test_photo_path_reflects_attached_photo(self):
        """Test that photo_path is the photo's path once a GameItemPhoto is attached."""
        photo = GameItemPhoto.objects.create(
            game_item=self.item, path='photos/game_items/1/photo.png',
        )
        self.item.photo = photo
        self.item.save()
        data = GameItemListSerializer(self.item).data
        assert data['photo_path'] == 'photos/game_items/1/photo.png'

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = GameItemListSerializer(self.item).data
        assert 'hidden' not in data


class TestGameItemAllListSerializer(TestCase):
    """Tests for the GameItemAllListSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.item = GameItemFactory(name='Cloak of Elvenkind')

    def test_includes_hidden_field_alongside_list_fields(self):
        """Test that the serializer exposes every GameItemListSerializer field plus hidden."""
        data = GameItemAllListSerializer(self.item).data
        assert set(data.keys()) == {'id', 'name', 'photo_path', 'hidden'}

    def test_hidden_reflects_the_game_item_own_field(self):
        """Test that hidden reflects the game item's own hidden field."""
        self.item.hidden = True
        self.item.save()
        data = GameItemAllListSerializer(self.item).data
        assert data['hidden'] is True
