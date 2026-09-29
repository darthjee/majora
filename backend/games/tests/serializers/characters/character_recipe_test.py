"""Tests for the CharacterRecipe plain serializers."""

from django.test import TestCase

from games.serializers import CharacterRecipeDetailSerializer, CharacterRecipeSerializer
from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
)

LIST_FIELDS = {
    'id', 'game_recipe_id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output',
}
DETAIL_FIELDS = LIST_FIELDS | {'description', 'ingredients', 'checks'}


class CharacterRecipeFixturesMixin:
    """Shared fixtures: a character knowing a recipe with a visible and one with a hidden output."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory()
        cls.character = CharacterFactory(game=cls.game, name='Frodo')
        cls.visible_item = GameCommonItemFactory(game=cls.game, name='Healing Potion')
        cls.hidden_item = GameCommonItemFactory(game=cls.game, name='Secret Poison', hidden=True)
        cls.game_recipe = GameRecipeFactory(
            game=cls.game, game_common_item=cls.visible_item, name='Brew Healing Potion',
            yield_quantity=2, crafting_time='8 hours', crafting_cost=50,
            description='Stir well.', ingredients='Herbs', checks='Alchemy DC 15',
        )
        cls.masked_recipe = GameRecipeFactory(
            game=cls.game, game_common_item=cls.hidden_item, name='Mysterious Distillation',
        )
        cls.character_recipe = CharacterRecipeFactory(
            character=cls.character, game_recipe=cls.game_recipe,
        )
        cls.masked_character_recipe = CharacterRecipeFactory(
            character=cls.character, game_recipe=cls.masked_recipe,
        )


class TestCharacterRecipeSerializer(CharacterRecipeFixturesMixin, TestCase):
    """Tests for the CharacterRecipeSerializer."""

    def test_only_exposes_expected_fields(self):
        """Test that only the documented index fields are exposed (no hidden)."""
        data = CharacterRecipeSerializer(self.character_recipe).data
        assert set(data.keys()) == LIST_FIELDS

    def test_id_is_the_character_recipe_row_id(self):
        """Test that id is the CharacterRecipe row id and game_recipe_id the recipe id."""
        data = CharacterRecipeSerializer(self.character_recipe).data
        assert data['id'] == self.character_recipe.id
        assert data['game_recipe_id'] == self.game_recipe.id

    def test_display_fields_come_from_game_recipe(self):
        """Test that display fields are sourced from the linked game recipe."""
        data = CharacterRecipeSerializer(self.character_recipe).data
        assert data['name'] == 'Brew Healing Potion'
        assert data['yield_quantity'] == 2
        assert data['crafting_time'] == '8 hours'
        assert data['crafting_cost'] == 50

    def test_visible_output_is_embedded(self):
        """Test that a visible output item is returned in full."""
        data = CharacterRecipeSerializer(self.character_recipe).data
        assert data['output'] == {
            'id': self.visible_item.id, 'name': 'Healing Potion', 'photo_path': None,
            'category': self.visible_item.category,
        }

    def test_hidden_output_is_masked_by_default(self):
        """Test that a hidden output item is masked to null without context."""
        data = CharacterRecipeSerializer(self.masked_character_recipe).data
        assert data['output'] is None

    def test_hidden_output_is_unmasked_when_context_disables_masking(self):
        """Test that a hidden output is returned when mask_hidden_output is False."""
        data = CharacterRecipeSerializer(
            self.masked_character_recipe, context={'mask_hidden_output': False},
        ).data
        assert data['output']['id'] == self.hidden_item.id

    def test_hidden_game_recipe_is_ignored(self):
        """Test that GameRecipe.hidden does not affect the serialized entry."""
        self.game_recipe.hidden = True
        self.game_recipe.save()
        data = CharacterRecipeSerializer(self.character_recipe).data
        assert data['name'] == 'Brew Healing Potion'


class TestCharacterRecipeDetailSerializer(CharacterRecipeFixturesMixin, TestCase):
    """Tests for the CharacterRecipeDetailSerializer."""

    def test_only_exposes_expected_fields(self):
        """Test that the detail adds description, ingredients and checks (no hidden)."""
        data = CharacterRecipeDetailSerializer(self.character_recipe).data
        assert set(data.keys()) == DETAIL_FIELDS

    def test_markdown_fields_come_from_game_recipe(self):
        """Test that markdown fields are sourced from the linked game recipe."""
        data = CharacterRecipeDetailSerializer(self.character_recipe).data
        assert data['description'] == 'Stir well.'
        assert data['ingredients'] == 'Herbs'
        assert data['checks'] == 'Alchemy DC 15'

    def test_hidden_output_is_masked_by_default(self):
        """Test that a hidden output item is masked to null without context."""
        data = CharacterRecipeDetailSerializer(self.masked_character_recipe).data
        assert data['output'] is None
