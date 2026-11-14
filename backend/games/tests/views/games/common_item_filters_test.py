"""Tests for the games.views.games._common_item_filters module."""

import pytest
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from games.models import GameCommonItem
from games.tests.factories import GameCommonItemFactory, GameFactory
from games.views.games._common_item_filters import (
    apply_common_item_filters,
    filter_by_category,
)


def _request(query=''):
    """Build a fake DRF Request carrying the given raw query string."""
    return Request(APIRequestFactory().get(f'/fake/?{query}'))


class _CommonItemsSetup:
    """Shared fixtures for the common items filters tests."""

    def setup_method(self):
        """Set up common items with distinct names, categories and prices."""
        game = GameFactory()
        self.potion = GameCommonItemFactory(
            game=game, name='Healing Potion', category='potion', price=10,
        )
        self.big_potion = GameCommonItemFactory(
            game=game, name='Big Healing Potion', category='potion', price=50,
        )
        self.rope = GameCommonItemFactory(game=game, name='Rope', category='gear', price=10)
        self.queryset = GameCommonItem.objects.all()
        self.everything = [self.potion, self.big_potion, self.rope]


@pytest.mark.django_db
class TestFilterByCategory(_CommonItemsSetup):
    """Tests for filter_by_category."""

    def _filter(self, query=''):
        """Run filter_by_category with the given raw query string."""
        return list(filter_by_category(_request(query), self.queryset))

    def test_returns_unchanged_queryset_when_param_absent(self):
        """Test that the queryset is unchanged when `category` is absent."""
        assert self._filter() == self.everything

    def test_returns_empty_for_unknown_value(self):
        """Test that an unknown category yields an empty list."""
        assert self._filter('category=foo') == []

    def test_ignores_empty_value(self):
        """Test that an empty category is treated as absent."""
        assert self._filter('category=') == self.everything

    def test_does_not_normalise_case(self):
        """Test that a wrong-case category yields an empty list."""
        assert self._filter('category=Potion') == []

    def test_last_value_wins_for_repeated_param(self):
        """Test that the last value of a repeated `category` param is used."""
        assert self._filter('category=potion&category=gear') == [self.rope]

    def test_filters_by_valid_value(self):
        """Test that a valid category filters by exact match."""
        assert self._filter('category=potion') == [self.potion, self.big_potion]


@pytest.mark.django_db
class TestApplyCommonItemFilters(_CommonItemsSetup):
    """Tests for apply_common_item_filters."""

    def _filter(self, query=''):
        """Run apply_common_item_filters with the given raw query string."""
        return list(apply_common_item_filters(_request(query), self.queryset))

    def test_returns_unchanged_queryset_without_params(self):
        """Test that the queryset is unchanged when no filter param is given."""
        assert self._filter() == self.everything

    def test_filters_by_name(self):
        """Test that `name` is applied as a case-insensitive substring match."""
        assert self._filter('name=big') == [self.big_potion]

    def test_filters_by_min_price(self):
        """Test that `min_price` is applied on `price`."""
        assert self._filter('min_price=11') == [self.big_potion]

    def test_filters_by_max_price(self):
        """Test that `max_price` is applied on `price`."""
        assert self._filter('max_price=10') == [self.potion, self.rope]

    def test_combines_all_filters_with_and(self):
        """Test that all four filters are combined with AND."""
        query = 'name=healing&category=potion&min_price=10&max_price=10'
        assert self._filter(query) == [self.potion]

    def test_returns_empty_when_one_filter_matches_nothing(self):
        """Test that a filter matching nothing empties the result whatever the others."""
        assert self._filter('name=rope&category=potion') == []

    def test_returns_empty_when_min_price_exceeds_max_price(self):
        """Test that `min_price` greater than `max_price` yields an empty list."""
        assert self._filter('min_price=50&max_price=10') == []
