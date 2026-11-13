"""Shared filter behaviours for the two game common items indexes (issue #1770).

A concrete test class mixes in `CommonItemsFiltersBehavior` and implements `_fetch(query)`,
returning the response of its index for the given query string (`?...` included).
"""

import json

from games.tests.factories import GameCommonItemFactory, GameFactory


class CommonItemsFiltersBehavior:
    """Filter tests shared by `common_items.json` and `common_items/all.json`."""

    VISIBLE_NAMES = ['Healing Potion', 'Greater Healing Potion', 'Rope', 'Free Ration']

    def _create_items(self):
        """Create the game and its visible and hidden common items."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        GameCommonItemFactory(game=self.game, name='Healing Potion', category='potion', price=10)
        GameCommonItemFactory(
            game=self.game, name='Greater Healing Potion', category='potion', price=30,
        )
        GameCommonItemFactory(game=self.game, name='Rope', category='gear', price=5)
        GameCommonItemFactory(game=self.game, name='Free Ration', category='consumable', price=0)
        GameCommonItemFactory(
            game=self.game, name='Healing Elixir', category='potion', price=20, hidden=True,
        )

    def _fetch(self, query=''):
        """Return the index response for `query`; implemented by the concrete class."""
        raise NotImplementedError

    def _names(self, query=''):
        """Return the item names of a successful index response for `query`."""
        response = self._fetch(query)
        assert response.status_code == 200
        return [item['name'] for item in json.loads(response.content)]

    def _visible(self, query):
        """Return the names for `query` restricted to the non-hidden fixtures."""
        return [name for name in self._names(query) if name in self.VISIBLE_NAMES]

    def test_without_params_returns_every_visible_item(self):
        """Test that no filter param keeps every visible item."""
        assert self._visible('') == self.VISIBLE_NAMES

    def test_filters_by_name(self):
        """Test that ?name= alone filters by case-insensitive substring."""
        assert self._visible('?name=greater') == ['Greater Healing Potion']

    def test_filters_by_category(self):
        """Test that ?category= alone filters by exact category."""
        assert self._visible('?category=potion') == ['Healing Potion', 'Greater Healing Potion']

    def test_unknown_category_returns_empty_list(self):
        """Test that an unknown ?category= returns 200 with an empty list."""
        assert self._names('?category=foo') == []

    def test_empty_category_is_ignored(self):
        """Test that an empty ?category= is treated as absent."""
        assert self._visible('?category=') == self.VISIBLE_NAMES

    def test_wrong_case_category_returns_empty_list(self):
        """Test that ?category= is not case-normalised."""
        assert self._names('?category=Potion') == []

    def test_filters_by_min_price(self):
        """Test that ?min_price= alone keeps items priced at or above it."""
        assert self._visible('?min_price=10') == ['Healing Potion', 'Greater Healing Potion']

    def test_filters_by_max_price(self):
        """Test that ?max_price= alone keeps items priced at or below it."""
        assert self._visible('?max_price=5') == ['Rope', 'Free Ration']

    def test_zero_price_is_applied(self):
        """Test that a `0` price bound is applied rather than treated as absent."""
        assert self._names('?max_price=0') == ['Free Ration']

    def test_non_numeric_price_is_ignored(self):
        """Test that a non-numeric ?min_price= is ignored."""
        assert self._visible('?min_price=abc') == self.VISIBLE_NAMES

    def test_combines_filters_with_and(self):
        """Test that name, category and price filters are combined with AND."""
        query = '?name=healing&category=potion&min_price=15&max_price=40'
        assert self._visible(query) == ['Greater Healing Potion']

    def test_min_price_greater_than_max_price_returns_empty_list(self):
        """Test that ?min_price= above ?max_price= returns an empty list."""
        assert self._names('?min_price=30&max_price=10') == []

    def test_unknown_params_are_ignored(self):
        """Test that unknown query params are silently ignored."""
        assert self._visible('?foo=bar') == self.VISIBLE_NAMES

    def test_pagination_headers_reflect_filtered_total(self):
        """Test that filters apply before pagination and headers reflect the filtered set."""
        response = self._fetch('?max_price=10&per_page=1')
        assert [item['name'] for item in json.loads(response.content)] == ['Healing Potion']
        assert response['page'] == '1'
        assert response['pages'] == '3'
        assert response['per_page'] == '1'
        assert response['total'] == '3'
