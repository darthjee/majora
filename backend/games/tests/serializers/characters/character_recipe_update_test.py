"""Tests for the CharacterRecipeUpdateSerializer."""

from django.test import TestCase

from games.serializers import CharacterRecipeUpdateSerializer
from games.tests.factories import CharacterFactory, CharacterRecipeFactory


class TestCharacterRecipeUpdateSerializer(TestCase):
    """Tests for the CharacterRecipeUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.character_recipe = CharacterRecipeFactory()

    def test_updates_hidden(self):
        """Test that hidden is written."""
        serializer = CharacterRecipeUpdateSerializer(
            self.character_recipe, data={'hidden': True}, partial=True,
        )
        assert serializer.is_valid()
        assert serializer.save().hidden is True

    def test_ignores_other_fields(self):
        """Test that fields other than hidden are ignored."""
        other = CharacterFactory()
        serializer = CharacterRecipeUpdateSerializer(
            self.character_recipe, data={'character': other.id, 'game_recipe': 1}, partial=True,
        )
        assert serializer.is_valid()
        assert serializer.validated_data == {}

    def test_rejects_non_boolean_hidden(self):
        """Test that a non-boolean hidden value is invalid."""
        serializer = CharacterRecipeUpdateSerializer(
            self.character_recipe, data={'hidden': 'maybe'}, partial=True,
        )
        assert not serializer.is_valid()
