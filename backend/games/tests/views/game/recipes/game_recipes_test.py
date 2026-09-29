"""Tests for the game recipes.json view (AllowAny, hidden excluded, output masked)."""

import json

import pytest

from games.models import GameCommonItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory


@pytest.mark.django_db
class TestGameRecipesView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/recipes.json."""

    def setup_method(self):
        """Set up a game with visible, hidden and masked-output recipes."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.potion = GameCommonItemFactory(
            game=self.game, name='Healing Potion', category=GameCommonItem.CATEGORY_POTION,
        )
        self.poison = GameCommonItemFactory(
            game=self.game, name='Secret Poison', hidden=True,
            category=GameCommonItem.CATEGORY_POISON,
        )
        self.visible = GameRecipeFactory(
            game=self.game, game_common_item=self.potion, name='Brew Potion',
        )
        self.hidden = GameRecipeFactory(
            game=self.game, game_common_item=self.potion, name='Secret Brew', hidden=True,
        )
        self.masked = GameRecipeFactory(
            game=self.game, game_common_item=self.poison, name='Mysterious Distillation',
        )

    def _url(self, query=''):
        """Return the recipes index URL, with an optional query string."""
        return f'/games/test-game/recipes.json{query}'

    def _names(self, client, query=''):
        """Return the recipe names listed by the index for the given query string."""
        return [item['name'] for item in json.loads(self.get(client, self._url(query)).content)]

    def test_returns_404_for_unknown_game(self, client):
        """Test that an unknown game slug returns 404."""
        assert self.get(client, '/games/unknown/recipes.json').status_code == 404

    def test_excludes_hidden_recipes_and_orders_by_id(self, client):
        """Test that hidden recipes are excluded and the rest are ordered by id."""
        assert self._names(client) == ['Brew Potion', 'Mysterious Distillation']

    def test_excludes_other_game_recipes(self, client):
        """Test that recipes from another game are not listed."""
        GameRecipeFactory(game=GameFactory(game_slug='other-game'), name='Foreign Brew')
        assert 'Foreign Brew' not in self._names(client)

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is returned as null."""
        data = json.loads(self.get(client, self._url()).content)
        by_name = {item['name']: item for item in data}
        assert by_name['Mysterious Distillation']['output'] is None
        assert by_name['Brew Potion']['output']['id'] == self.potion.id

    def test_does_not_expose_hidden_or_detail_fields(self, client):
        """Test that neither hidden nor the detail-only fields are exposed."""
        data = json.loads(self.get(client, self._url()).content)
        assert set(data[0].keys()) == {
            'id', 'name', 'yield_quantity', 'crafting_time', 'crafting_cost', 'output',
        }

    def test_does_not_set_skip_cache(self, client):
        """Test that the plain index does not set X-Skip-Cache."""
        assert 'X-Skip-Cache' not in self.get(client, self._url())

    def test_paginates(self, client):
        """Test that ?page= / ?per_page= paginate the results."""
        response = self.get(client, self._url('?page=2&per_page=1'))
        assert response['pages'] == '2'
        assert [item['name'] for item in json.loads(response.content)] == [
            'Mysterious Distillation',
        ]

    def test_category_filter_matches_output_category(self, client):
        """Test that ?category= keeps recipes whose output has that category."""
        assert self._names(client, '?category=potion') == ['Brew Potion']

    def test_category_filter_never_matches_masked_output(self, client):
        """Test that a recipe with a hidden output never matches a category filter."""
        assert self._names(client, '?category=poison') == []

    def test_unknown_category_returns_empty_list(self, client):
        """Test that an unknown category value returns an empty list."""
        response = self.get(client, self._url('?category=unknown'))
        assert response.status_code == 200
        assert json.loads(response.content) == []
