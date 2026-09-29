"""Tests for the CharacterRecipe `/all.json` and `/full.json` serializers."""

from django.test import TestCase

from games.serializers import CharacterRecipeAllSerializer, CharacterRecipeDetailFullSerializer
from games.tests.serializers.characters.character_recipe_test import (
    DETAIL_FIELDS,
    LIST_FIELDS,
    CharacterRecipeFixturesMixin,
)


class TestCharacterRecipeAllSerializer(CharacterRecipeFixturesMixin, TestCase):
    """Tests for the CharacterRecipeAllSerializer."""

    def test_adds_hidden_to_list_fields(self):
        """Test that the serializer exposes every list field plus hidden."""
        data = CharacterRecipeAllSerializer(self.character_recipe).data
        assert set(data.keys()) == LIST_FIELDS | {'hidden'}

    def test_hidden_reflects_character_recipe_own_flag(self):
        """Test that hidden is CharacterRecipe.hidden, not GameRecipe.hidden."""
        self.game_recipe.hidden = True
        self.game_recipe.save()
        data = CharacterRecipeAllSerializer(self.character_recipe).data
        assert data['hidden'] is False

    def test_hidden_true_when_row_hidden(self):
        """Test that hidden is True when the CharacterRecipe row is hidden."""
        self.character_recipe.hidden = True
        self.character_recipe.save()
        data = CharacterRecipeAllSerializer(self.character_recipe).data
        assert data['hidden'] is True

    def test_hidden_output_is_masked_by_default(self):
        """Test that the all variant still masks a hidden output without context."""
        data = CharacterRecipeAllSerializer(self.masked_character_recipe).data
        assert data['output'] is None

    def test_hidden_output_is_unmasked_when_context_disables_masking(self):
        """Test that the all variant returns a hidden output for GameEdit callers."""
        data = CharacterRecipeAllSerializer(
            self.masked_character_recipe, context={'mask_hidden_output': False},
        ).data
        assert data['output']['id'] == self.hidden_item.id


class TestCharacterRecipeDetailFullSerializer(CharacterRecipeFixturesMixin, TestCase):
    """Tests for the CharacterRecipeDetailFullSerializer."""

    def test_adds_hidden_to_detail_fields(self):
        """Test that the serializer exposes every detail field plus hidden."""
        data = CharacterRecipeDetailFullSerializer(self.character_recipe).data
        assert set(data.keys()) == DETAIL_FIELDS | {'hidden'}

    def test_hidden_output_is_masked_by_default(self):
        """Test that the full variant still masks a hidden output without context."""
        data = CharacterRecipeDetailFullSerializer(self.masked_character_recipe).data
        assert data['output'] is None

    def test_hidden_output_is_unmasked_when_context_disables_masking(self):
        """Test that the full variant returns a hidden output for GameEdit callers."""
        data = CharacterRecipeDetailFullSerializer(
            self.masked_character_recipe, context={'mask_hidden_output': False},
        ).data
        assert data['output']['id'] == self.hidden_item.id
