"""Tests for the common_items/<id>/recipes.json view (AllowAny, hidden excluded)."""

import json

import pytest

from games.models import GameCommonItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import GameCommonItemFactory, GameFactory, GameRecipeFactory


@pytest.mark.django_db
class TestGameCommonItemRecipesView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/common_items/<id>/recipes.json."""

    def setup_method(self):
        """Set up a game, a visible common item and recipes producing it or another item."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.potion = GameCommonItemFactory(
            game=self.game, name='Healing Potion', category=GameCommonItem.CATEGORY_POTION,
        )
        GameRecipeFactory(game=self.game, game_common_item=self.potion, name='Brew')
        GameRecipeFactory(game=self.game, game_common_item=self.potion, name='Distill')
        GameRecipeFactory(
            game=self.game, game_common_item=self.potion, name='Secret Brew', hidden=True,
        )
        GameRecipeFactory(game=self.game, name='Unrelated Recipe')

    def _url(self, common_item_id=None, query=''):
        """Return the common item recipes URL (defaults to the fixture item)."""
        item_id = common_item_id or self.potion.id
        return f'/games/test-game/common_items/{item_id}/recipes.json{query}'

    def _names(self, client, query=''):
        """Return the recipe names listed for the fixture item and query string."""
        response = self.get(client, self._url(query=query))
        return [item['name'] for item in json.loads(response.content)]

    def test_lists_visible_recipes_of_the_item_ordered_by_id(self, client):
        """Test that only the item's non-hidden recipes are listed, ordered by id."""
        assert self._names(client) == ['Brew', 'Distill']

    def test_includes_output(self, client):
        """Test that each entry embeds the (visible) output item."""
        data = json.loads(self.get(client, self._url()).content)
        assert data[0]['output']['id'] == self.potion.id
        assert 'hidden' not in data[0]

    def test_returns_404_for_hidden_common_item(self, client):
        """Test that a hidden common item returns 404."""
        hidden_item = GameCommonItemFactory(game=self.game, hidden=True)
        assert self.get(client, self._url(hidden_item.id)).status_code == 404

    def test_returns_404_for_unknown_common_item(self, client):
        """Test that an unknown common item returns 404."""
        assert self.get(client, self._url(self.potion.id + 1000)).status_code == 404

    def test_returns_404_for_other_game_common_item(self, client):
        """Test that a common item from another game returns 404."""
        other_item = GameCommonItemFactory(game=GameFactory(game_slug='other-game'))
        assert self.get(client, self._url(other_item.id)).status_code == 404

    def test_paginates(self, client):
        """Test that ?page= / ?per_page= paginate the results."""
        response = self.get(client, self._url(query='?page=2&per_page=1'))
        assert response['pages'] == '2'
        assert [item['name'] for item in json.loads(response.content)] == ['Distill']

    def test_ignores_category_filter(self, client):
        """Test that ?category= is ignored on this endpoint."""
        assert self._names(client, '?category=poison') == ['Brew', 'Distill']

    def test_does_not_set_skip_cache(self, client):
        """Test that the plain endpoint does not set X-Skip-Cache."""
        assert 'X-Skip-Cache' not in self.get(client, self._url())
