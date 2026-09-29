"""Tests for the game recipes/<id>.json view (AllowAny, hidden 404s, output masked)."""

import json

import pytest

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory


@pytest.mark.django_db
class TestGameRecipeDetailView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/recipes/<id>.json."""

    def setup_method(self):
        """Set up a game with a visible recipe."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.recipe = GameRecipeFactory(
            game=self.game, name='Brew Potion', description='Stir.', ingredients='Herbs',
            checks='Alchemy DC 15',
        )

    def _url(self, recipe_id):
        """Return the recipe detail URL for the given id."""
        return f'/games/test-game/recipes/{recipe_id}.json'

    def test_returns_detail_fields(self, client):
        """Test that the detail fields are returned without hidden."""
        data = json.loads(self.get(client, self._url(self.recipe.id)).content)
        assert data['name'] == 'Brew Potion'
        assert data['ingredients'] == 'Herbs'
        assert set(data.keys()) == {
            'id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output',
            'description', 'ingredients', 'checks',
        }

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is returned as null."""
        hidden_item = GameCommonItemFactory(game=self.game, hidden=True)
        recipe = GameRecipeFactory(game=self.game, game_common_item=hidden_item)
        data = json.loads(self.get(client, self._url(recipe.id)).content)
        assert data['output'] is None

    def test_returns_404_for_hidden_recipe(self, client):
        """Test that a hidden recipe returns 404."""
        recipe = GameRecipeFactory(game=self.game, hidden=True)
        assert self.get(client, self._url(recipe.id)).status_code == 404

    def test_returns_404_for_unknown_recipe(self, client):
        """Test that an unknown recipe id returns 404."""
        assert self.get(client, self._url(self.recipe.id + 1000)).status_code == 404

    def test_returns_404_for_other_game_recipe(self, client):
        """Test that a recipe from another game returns 404."""
        recipe = GameRecipeFactory(game=GameFactory(game_slug='other-game'))
        assert self.get(client, self._url(recipe.id)).status_code == 404

    def test_does_not_set_skip_cache(self, client):
        """Test that the plain detail does not set X-Skip-Cache."""
        assert 'X-Skip-Cache' not in self.get(client, self._url(self.recipe.id))
