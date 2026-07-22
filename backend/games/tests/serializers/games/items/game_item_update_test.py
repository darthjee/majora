"""Tests for the GameItemUpdateSerializer."""

from django.test import TestCase

from games.serializers import GameItemUpdateSerializer
from games.tests.factories import GameFactory, GameItemFactory


class TestGameItemUpdateSerializer(TestCase):
    """Tests for GameItemUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game item instance for testing."""
        cls.item = GameItemFactory(
            name='Enchanted Bow', description='A fine bow.', hidden=False,
        )

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = GameItemUpdateSerializer(
            self.item, data={'name': 'Silver Bow'}, partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.name == 'Silver Bow'

    def test_valid_partial_description_update(self):
        """Test that a partial update with only description is valid."""
        serializer = GameItemUpdateSerializer(
            self.item, data={'description': 'A finer bow.'}, partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.description == 'A finer bow.'

    def test_valid_partial_hidden_update(self):
        """Test that a partial update with only hidden leaves name/description untouched."""
        serializer = GameItemUpdateSerializer(self.item, data={'hidden': True}, partial=True)
        assert serializer.is_valid()
        item = serializer.save()
        assert item.hidden is True
        assert item.name == 'Enchanted Bow'
        assert item.description == 'A fine bow.'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = GameItemUpdateSerializer(self.item, data={}, partial=True)
        assert serializer.is_valid()

    def test_blank_name_is_rejected(self):
        """Test that a blank name is rejected — GameItem has no fallback target."""
        serializer = GameItemUpdateSerializer(self.item, data={'name': ''}, partial=True)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_invalid_name_too_long(self):
        """Test that a name exceeding max_length is rejected."""
        serializer = GameItemUpdateSerializer(self.item, data={'name': 'x' * 201}, partial=True)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors

    def test_game_and_id_are_not_included(self):
        """Test that game and id are not fields in the serializer."""
        other_game = GameFactory()
        original_game_id = self.item.game_id
        serializer = GameItemUpdateSerializer(
            self.item,
            data={'name': 'New Name', 'game': other_game.id, 'id': 999},
            partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.name == 'New Name'
        assert item.game_id == original_game_id
        assert item.id != 999
