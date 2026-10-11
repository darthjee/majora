"""Tests for the staff copy-type registry."""

import pytest

from games.models import GameItem
from games.tests.factories import GameFactory, GameItemFactory
from staff import copy_types
from staff.copy_types import RESERVED_SLUGS, CopyType
from staff.tests.copy_test_support import FakeCopyType, register_copy_types


class TestCopyTypesRegistry:
    """Tests for the real, shipped copy-type registry."""

    def test_registry_is_empty(self):
        """Test that no copy type is registered yet."""
        assert copy_types.slugs() == []

    def test_find_unknown_slug_returns_none(self):
        """Test that an unregistered slug resolves to None."""
        assert copy_types.find('items') is None

    def test_no_registered_slug_is_reserved(self):
        """Test that no registered copy type uses a reserved slug."""
        assert not set(copy_types.slugs()) & RESERVED_SLUGS


class TestCopyTypesLookup:
    """Tests for `find`/`slugs` on a patched registry."""

    def test_slugs_follow_registry_order(self, monkeypatch):
        """Test that `slugs` returns the registered slugs in registry order."""
        register_copy_types(
            monkeypatch, FakeCopyType('items', GameItem), FakeCopyType('recipes', GameItem),
        )
        assert copy_types.slugs() == ['items', 'recipes']

    def test_find_returns_registered_entry(self, monkeypatch):
        """Test that `find` returns the entry registered under the slug."""
        entry = FakeCopyType('items', GameItem)
        register_copy_types(monkeypatch, entry)
        assert copy_types.find('items') is entry


@pytest.mark.django_db
class TestCopyType:
    """Tests for the `CopyType` base class."""

    def setup_method(self):
        """Set up a copy type over `GameItem` and a source item."""
        self.copy_type = CopyType('items', GameItem)
        self.game = GameFactory(name='Source', game_slug='source')
        self.item = GameItemFactory(game=self.game)

    def test_find_source_returns_row_with_game(self, django_assert_num_queries):
        """Test that `find_source` returns the row with its game already selected."""
        with django_assert_num_queries(1):
            source = self.copy_type.find_source(self.item.id)
            assert source.game.game_slug == 'source'
        assert source == self.item

    def test_find_source_returns_none_for_unknown_id(self):
        """Test that `find_source` returns None for an unknown id."""
        assert self.copy_type.find_source(self.item.id + 1000) is None

    def test_list_raises_not_implemented(self):
        """Test that the base `list` is not implemented."""
        with pytest.raises(NotImplementedError):
            self.copy_type.list(None, self.game, self.game)

    def test_copy_raises_not_implemented(self):
        """Test that the base `copy` is not implemented."""
        with pytest.raises(NotImplementedError):
            self.copy_type.copy(None, self.item, self.game)
