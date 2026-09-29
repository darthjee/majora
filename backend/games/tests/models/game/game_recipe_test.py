"""Tests for the GameRecipe model."""

from django.test import TestCase

from games.models import GameRecipe
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory


class TestGameRecipe(TestCase):
    """Tests for the GameRecipe model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.common_item = GameCommonItemFactory(game=cls.game, name='Healing Potion')

    def _create_recipe(self, **kwargs):
        """Create a recipe for the shared game and output item."""
        return GameRecipe.objects.create(
            game=self.game, game_common_item=self.common_item, **kwargs,
        )

    def test_game_recipe_creation(self):
        """Test that a game recipe can be created linked to a game and an output item."""
        recipe = self._create_recipe(name='Brew Healing Potion', crafting_cost=50)
        assert recipe.game == self.game
        assert recipe.game_common_item == self.common_item
        assert recipe.name == 'Brew Healing Potion'
        assert recipe.crafting_cost == 50

    def test_defaults(self):
        """Test the default values of the optional fields."""
        recipe = self._create_recipe(name='Brew')
        assert recipe.description == ''
        assert recipe.hidden is False
        assert recipe.yield_quantity == 1
        assert recipe.crafting_time == ''
        assert recipe.crafting_cost == 0
        assert recipe.ingredients == ''
        assert recipe.checks == ''

    def test_game_recipe_str(self):
        """Test string representation of a game recipe."""
        recipe = GameRecipe(game=self.game, game_common_item=self.common_item, name='Brew')
        assert str(recipe) == 'Brew'

    def test_game_recipe_ordering(self):
        """Test that game recipes are ordered by id."""
        first = self._create_recipe(name='Zeta')
        second = self._create_recipe(name='Alpha')
        assert list(GameRecipe.objects.all()) == [first, second]

    def test_related_names(self):
        """Test that recipes are reachable from the game and from the output item."""
        recipe = self._create_recipe(name='Brew')
        assert list(self.game.recipes.all()) == [recipe]
        assert list(self.common_item.recipes.all()) == [recipe]

    def test_several_recipes_can_share_an_output(self):
        """Test that the output item is not unique across recipes."""
        self._create_recipe(name='Brew')
        self._create_recipe(name='Distill')
        assert self.common_item.recipes.count() == 2

    def test_deleting_common_item_cascades_to_recipe(self):
        """Test that deleting the output common item deletes its recipes."""
        common_item = GameCommonItemFactory(game=self.game)
        recipe = GameRecipeFactory(game=self.game, game_common_item=common_item)
        common_item.delete()
        assert not GameRecipe.objects.filter(id=recipe.id).exists()

    def test_deleting_game_cascades_to_recipe(self):
        """Test that deleting a game deletes its recipes."""
        game = GameFactory(name='Other Game', game_slug='other-game')
        recipe = GameRecipeFactory(game=game)
        game.delete()
        assert not GameRecipe.objects.filter(id=recipe.id).exists()

    def test_factory_uses_common_item_of_same_game(self):
        """Test that the factory defaults the output item to one of the same game."""
        recipe = GameRecipeFactory(game=self.game)
        assert recipe.game_common_item.game == self.game

    def test_history_is_tracked(self):
        """Test that changes to a recipe are recorded in its history."""
        recipe = self._create_recipe(name='Brew')
        recipe.name = 'Brew Better'
        recipe.save()
        assert recipe.history.count() == 2
