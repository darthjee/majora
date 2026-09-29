"""Tests for the CharacterRecipe model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import CharacterRecipe
from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameFactory,
    GameRecipeFactory,
)


class TestCharacterRecipe(TestCase):
    """Tests for the CharacterRecipe model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_recipe = GameRecipeFactory(game=cls.game, name='Lembas')

    def _create(self, **kwargs):
        """Create a character recipe linking the default character and recipe."""
        return CharacterRecipe.objects.create(
            character=self.character, game_recipe=self.game_recipe, **kwargs,
        )

    def test_character_recipe_creation(self):
        """Test that a character recipe links a character and a game recipe."""
        character_recipe = self._create()
        assert character_recipe.character == self.character
        assert character_recipe.game_recipe == self.game_recipe

    def test_hidden_defaults_to_false(self):
        """Test that a character recipe is not hidden by default."""
        assert self._create().hidden is False

    def test_character_recipe_can_be_hidden(self):
        """Test that a character recipe can be created as hidden."""
        assert self._create(hidden=True).hidden is True

    def test_str_uses_game_recipe_name(self):
        """Test that str() returns the linked game recipe's name."""
        character_recipe = CharacterRecipe(
            character=self.character, game_recipe=self.game_recipe,
        )
        assert str(character_recipe) == 'Lembas'

    def test_character_recipes_related_name(self):
        """Test that character recipes are reachable via the character's related name."""
        self._create()
        other_recipe = GameRecipeFactory(game=self.game, name='Miruvor')
        CharacterRecipe.objects.create(character=self.character, game_recipe=other_recipe)
        assert self.character.character_recipes.count() == 2

    def test_game_recipe_character_recipes_related_name(self):
        """Test that character recipes are reachable via the game recipe's related name."""
        self._create()
        assert self.game_recipe.character_recipes.count() == 1

    def test_character_recipe_ordering(self):
        """Test that character recipes are ordered by id."""
        first = self._create()
        other_recipe = GameRecipeFactory(game=self.game, name='Miruvor')
        second = CharacterRecipe.objects.create(
            character=self.character, game_recipe=other_recipe,
        )
        ids = list(CharacterRecipe.objects.values_list('id', flat=True))
        assert ids == [first.id, second.id]

    def test_deleting_character_cascades(self):
        """Test that deleting a character deletes its character recipes."""
        character_recipe = self._create()
        self.character.delete()
        assert not CharacterRecipe.objects.filter(id=character_recipe.id).exists()

    def test_deleting_game_recipe_cascades(self):
        """Test that deleting a game recipe deletes the linking character recipe."""
        character_recipe = self._create()
        self.game_recipe.delete()
        assert not CharacterRecipe.objects.filter(id=character_recipe.id).exists()

    def test_deleting_output_common_item_cascades(self):
        """Test that deleting the recipe's output common item deletes the character recipe."""
        character_recipe = self._create()
        self.game_recipe.game_common_item.delete()
        assert not CharacterRecipe.objects.filter(id=character_recipe.id).exists()

    def test_duplicate_character_recipe_raises_integrity_error(self):
        """Test that a second row for the same character/game_recipe pair is rejected."""
        self._create()
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                self._create()

    def test_factory_builds_recipe_in_character_game(self):
        """Test that the factory builds the game recipe in the character's game."""
        character_recipe = CharacterRecipeFactory(character=self.character)
        assert character_recipe.game_recipe.game == self.game
