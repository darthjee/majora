"""Tests for the GameRecipe list/detail serializers."""

from django.test import TestCase

from games.serializers import (
    GameRecipeAllListSerializer,
    GameRecipeDetailFullSerializer,
    GameRecipeDetailSerializer,
    GameRecipeListSerializer,
)
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory

LIST_FIELDS = {'id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output'}
DETAIL_FIELDS = LIST_FIELDS | {'description', 'ingredients', 'checks'}


class RecipeFixturesMixin:
    """Shared fixtures: one recipe with a visible output and one with a hidden output."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory()
        cls.visible_item = GameCommonItemFactory(game=cls.game, name='Healing Potion')
        cls.hidden_item = GameCommonItemFactory(game=cls.game, name='Secret Poison', hidden=True)
        cls.recipe = GameRecipeFactory(
            game=cls.game, game_common_item=cls.visible_item, name='Brew Healing Potion',
            yield_quantity=2, crafting_time='8 hours', crafting_cost=50,
            description='Stir well.', ingredients='Herbs', checks='Alchemy DC 15',
        )
        cls.masked_recipe = GameRecipeFactory(
            game=cls.game, game_common_item=cls.hidden_item, name='Mysterious Distillation',
        )


class TestGameRecipeListSerializer(RecipeFixturesMixin, TestCase):
    """Tests for the GameRecipeListSerializer."""

    def test_only_exposes_expected_fields(self):
        """Test that only the documented index fields are exposed."""
        data = GameRecipeListSerializer(self.recipe).data
        assert set(data.keys()) == LIST_FIELDS

    def test_serializes_values(self):
        """Test that the recipe's own fields are serialized."""
        data = GameRecipeListSerializer(self.recipe).data
        assert data['id'] == self.recipe.id
        assert data['name'] == 'Brew Healing Potion'
        assert data['yield_quantity'] == 2
        assert data['crafting_time'] == '8 hours'
        assert data['crafting_cost'] == 50

    def test_serializes_visible_output(self):
        """Test that a visible output item is embedded as a nested object."""
        data = GameRecipeListSerializer(self.recipe).data
        assert data['output'] == {
            'id': self.visible_item.id, 'name': 'Healing Potion', 'photo_path': None,
            'category': self.visible_item.category,
        }

    def test_masks_hidden_output(self):
        """Test that a hidden output item is masked as null."""
        data = GameRecipeListSerializer(self.masked_recipe).data
        assert data['output'] is None


class TestGameRecipeAllListSerializer(RecipeFixturesMixin, TestCase):
    """Tests for the GameRecipeAllListSerializer."""

    def test_only_exposes_expected_fields(self):
        """Test that the index fields plus hidden are exposed."""
        data = GameRecipeAllListSerializer(self.recipe).data
        assert set(data.keys()) == LIST_FIELDS | {'hidden'}

    def test_serializes_hidden(self):
        """Test that the hidden flag reflects the recipe's own hidden value."""
        self.recipe.hidden = True
        data = GameRecipeAllListSerializer(self.recipe).data
        assert data['hidden'] is True

    def test_returns_real_hidden_output(self):
        """Test that a hidden output item is returned in full."""
        data = GameRecipeAllListSerializer(self.masked_recipe).data
        assert data['output']['id'] == self.hidden_item.id
        assert data['output']['name'] == 'Secret Poison'


class TestGameRecipeDetailSerializer(RecipeFixturesMixin, TestCase):
    """Tests for the GameRecipeDetailSerializer."""

    def test_only_exposes_expected_fields(self):
        """Test that the detail fields are exposed, without hidden."""
        data = GameRecipeDetailSerializer(self.recipe).data
        assert set(data.keys()) == DETAIL_FIELDS

    def test_serializes_markdown_fields(self):
        """Test that description, ingredients and checks are serialized."""
        data = GameRecipeDetailSerializer(self.recipe).data
        assert data['description'] == 'Stir well.'
        assert data['ingredients'] == 'Herbs'
        assert data['checks'] == 'Alchemy DC 15'

    def test_masks_hidden_output(self):
        """Test that a hidden output item is masked as null."""
        data = GameRecipeDetailSerializer(self.masked_recipe).data
        assert data['output'] is None


class TestGameRecipeDetailFullSerializer(RecipeFixturesMixin, TestCase):
    """Tests for the GameRecipeDetailFullSerializer."""

    def test_only_exposes_expected_fields(self):
        """Test that the detail fields plus hidden are exposed."""
        data = GameRecipeDetailFullSerializer(self.recipe).data
        assert set(data.keys()) == DETAIL_FIELDS | {'hidden'}

    def test_returns_real_hidden_output(self):
        """Test that a hidden output item is returned in full."""
        data = GameRecipeDetailFullSerializer(self.masked_recipe).data
        assert data['output']['id'] == self.hidden_item.id
