"""Tests for the GameItemDetailSerializer/GameItemDetailFullSerializer."""

from django.test import TestCase

from games.serializers import GameItemDetailFullSerializer, GameItemDetailSerializer
from games.tests.factories import GameItemFactory


class TestGameItemDetailSerializer(TestCase):
    """Tests for the GameItemDetailSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.item = GameItemFactory(name='Cloak of Elvenkind', description='A shimmering cloak.')

    def test_serializes_description(self):
        """Test that the description field is serialized."""
        data = GameItemDetailSerializer(self.item).data
        assert data['description'] == 'A shimmering cloak.'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = GameItemDetailSerializer(self.item).data
        assert set(data.keys()) == {'id', 'name', 'description', 'photo_path'}


class TestGameItemDetailFullSerializer(TestCase):
    """Tests for the GameItemDetailFullSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.item = GameItemFactory(name='Cloak of Elvenkind', description='A shimmering cloak.')

    def test_includes_hidden_field_alongside_detail_fields(self):
        """Test that the serializer exposes every GameItemDetailSerializer field plus hidden."""
        data = GameItemDetailFullSerializer(self.item).data
        assert set(data.keys()) == {'id', 'name', 'description', 'photo_path', 'hidden'}

    def test_hidden_reflects_the_game_item_own_field(self):
        """Test that hidden reflects the game item's own hidden field."""
        self.item.hidden = True
        self.item.save()
        data = GameItemDetailFullSerializer(self.item).data
        assert data['hidden'] is True
