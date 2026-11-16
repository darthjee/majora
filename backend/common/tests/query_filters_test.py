"""Tests for the common.query_filters module."""

import pytest
from django.contrib.auth.models import User
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from common.query_filters import filter_by_max, filter_by_min, filter_by_name
from games.models import GameCommonItem
from games.tests.factories import GameCommonItemFactory, GameFactory, UserFactory
from miniatures.models import Source
from miniatures.tests.factories import SourceFactory


def _request(name=None):
    """Build a fake DRF Request, optionally carrying a `name` query param."""
    factory = APIRequestFactory()
    query = {'name': name} if name is not None else {}
    return Request(factory.get('/fake/', query))


def _params_request(**params):
    """Build a fake DRF Request carrying the given query params."""
    return Request(APIRequestFactory().get('/fake/', params))


@pytest.mark.django_db
class TestFilterByName:
    """Tests for filter_by_name."""

    def setup_method(self):
        """Set up a few users with distinct usernames to filter by."""
        self.dragon = UserFactory(username='dragon-rider')
        self.goblin = UserFactory(username='goblin-slayer')

    def test_returns_unchanged_queryset_when_name_param_absent(self):
        """Test that the queryset is returned unchanged when no `name` param is present."""
        queryset = User.objects.all()
        result = filter_by_name(_request(), queryset, field='username')
        assert set(result) == set(queryset)

    def test_returns_unchanged_queryset_when_name_param_blank(self):
        """Test that the queryset is returned unchanged when `name` is blank."""
        queryset = User.objects.all()
        result = filter_by_name(_request(''), queryset, field='username')
        assert set(result) == set(queryset)

    def test_filters_by_name_icontains_case_insensitively(self):
        """Test that a real substring filters the given field, case-insensitively."""
        queryset = User.objects.all()
        result = filter_by_name(_request('DRAGON'), queryset, field='username')
        assert list(result) == [self.dragon]

    def test_defaults_to_filtering_the_name_field(self):
        """Test that the default `field` argument is `name`."""
        SourceFactory(name='MyMiniFactory')
        other = SourceFactory(name='Thingiverse')

        result = filter_by_name(_request('mini'), Source.objects.all())

        assert list(result) == [Source.objects.get(name='MyMiniFactory')]
        assert other not in result


class _IntRangeSetup:
    """Shared fixtures for the int-range helper tests."""

    def setup_method(self):
        """Set up common items with distinct prices to filter by."""
        game = GameFactory()
        self.negative = GameCommonItemFactory(game=game, price=-5)
        self.zero = GameCommonItemFactory(game=game, price=0)
        self.cheap = GameCommonItemFactory(game=game, price=10)
        self.pricey = GameCommonItemFactory(game=game, price=50)
        self.everything = [self.negative, self.zero, self.cheap, self.pricey]
        self.queryset = GameCommonItem.objects.all()


@pytest.mark.django_db
class TestFilterByMin(_IntRangeSetup):
    """Tests for filter_by_min."""

    def _filter(self, **params):
        """Run filter_by_min on `price` with `min_price` from the given params."""
        return list(filter_by_min(_params_request(**params), self.queryset, 'min_price', 'price'))

    def test_returns_unchanged_queryset_when_param_absent(self):
        """Test that the queryset is unchanged when the param is absent."""
        assert self._filter() == self.everything

    def test_ignores_empty_value(self):
        """Test that an empty value is ignored."""
        assert self._filter(min_price='') == self.everything

    def test_ignores_non_numeric_value(self):
        """Test that a non-numeric value is ignored."""
        assert self._filter(min_price='abc') == self.everything

    def test_ignores_decimal_value(self):
        """Test that a decimal value is ignored."""
        assert self._filter(min_price='1.5') == self.everything

    def test_applies_zero(self):
        """Test that `0` is applied, not treated as absent."""
        assert self._filter(min_price='0') == [self.zero, self.cheap, self.pricey]

    def test_applies_negative_value(self):
        """Test that a negative value is applied."""
        assert self._filter(min_price='-1') == [self.zero, self.cheap, self.pricey]

    def test_applies_gte_on_the_given_field(self):
        """Test that a valid value applies `<field>__gte`."""
        assert self._filter(min_price='10') == [self.cheap, self.pricey]

    def test_reads_the_given_param_name(self):
        """Test that only the given param name is read."""
        result = filter_by_min(_params_request(low='50'), self.queryset, 'low', 'price')
        assert list(result) == [self.pricey]


@pytest.mark.django_db
class TestFilterByMax(_IntRangeSetup):
    """Tests for filter_by_max."""

    def _filter(self, **params):
        """Run filter_by_max on `price` with `max_price` from the given params."""
        return list(filter_by_max(_params_request(**params), self.queryset, 'max_price', 'price'))

    def test_returns_unchanged_queryset_when_param_absent(self):
        """Test that the queryset is unchanged when the param is absent."""
        assert self._filter() == self.everything

    def test_ignores_empty_value(self):
        """Test that an empty value is ignored."""
        assert self._filter(max_price='') == self.everything

    def test_ignores_non_numeric_value(self):
        """Test that a non-numeric value is ignored."""
        assert self._filter(max_price='abc') == self.everything

    def test_ignores_decimal_value(self):
        """Test that a decimal value is ignored."""
        assert self._filter(max_price='1.5') == self.everything

    def test_applies_zero(self):
        """Test that `0` is applied, not treated as absent."""
        assert self._filter(max_price='0') == [self.negative, self.zero]

    def test_applies_negative_value(self):
        """Test that a negative value is applied."""
        assert self._filter(max_price='-1') == [self.negative]

    def test_applies_lte_on_the_given_field(self):
        """Test that a valid value applies `<field>__lte`."""
        assert self._filter(max_price='10') == [self.negative, self.zero, self.cheap]

    def test_reads_the_given_param_name(self):
        """Test that only the given param name is read."""
        result = filter_by_max(_params_request(high='0'), self.queryset, 'high', 'price')
        assert list(result) == [self.negative, self.zero]
