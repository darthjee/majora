"""Tests for the CharacterItemUpdateSerializer."""

from django.test import TestCase

from games.serializers import CharacterItemUpdateSerializer
from games.tests.factories import CharacterItemFactory, GameItemFactory


class TestCharacterItemUpdateSerializer(TestCase):
    """Tests for CharacterItemUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game item and a character item overriding its name/description."""
        cls.game_item = GameItemFactory(name='Prized Gem', description='Very shiny.')
        cls.character_item = CharacterItemFactory(
            game_item=cls.game_item, name="Aragorn's Gem", description='His own gem.',
        )

    def test_valid_partial_name_update(self):
        """Test that a partial update with only name is valid."""
        serializer = CharacterItemUpdateSerializer(
            self.character_item, data={'name': 'New Name'}, partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.name == 'New Name'

    def test_valid_partial_hidden_update(self):
        """Test that a partial update with only hidden leaves name/description untouched."""
        serializer = CharacterItemUpdateSerializer(
            self.character_item, data={'hidden': True}, partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.hidden is True
        assert item.name == "Aragorn's Gem"
        assert item.description == 'His own gem.'

    def test_all_fields_optional(self):
        """Test that an empty payload is valid (all fields optional)."""
        serializer = CharacterItemUpdateSerializer(self.character_item, data={}, partial=True)
        assert serializer.is_valid()

    def test_blank_name_persists_as_null(self):
        """Test that a blank name is coerced to null, falling back to the linked GameItem."""
        serializer = CharacterItemUpdateSerializer(
            self.character_item, data={'name': ''}, partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.name is None

    def test_blank_description_persists_as_null(self):
        """Test that a blank description is coerced to null, falling back to the GameItem."""
        serializer = CharacterItemUpdateSerializer(
            self.character_item, data={'description': ''}, partial=True,
        )
        assert serializer.is_valid()
        item = serializer.save()
        assert item.description is None

    def test_invalid_name_too_long(self):
        """Test that a name exceeding max_length is rejected."""
        serializer = CharacterItemUpdateSerializer(
            self.character_item, data={'name': 'x' * 201}, partial=True,
        )
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
