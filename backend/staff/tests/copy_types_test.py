"""Tests for the staff copy-type registry."""

import pytest
from django.test import RequestFactory

from games.models import GameCommonItem, GameItem
from games.tests.factories import (
    CharacterFactory,
    GameCommonItemFactory,
    GameFactory,
    GameItemFactory,
    UserFactory,
)
from staff import copy_types
from staff.copy_types import RESERVED_SLUGS, CopyType, ModelCopyType
from staff.copy_types_common_items import CommonItemsCopyType
from staff.copy_types_items import ItemsCopyType
from staff.copy_types_recipes import RecipesCopyType
from staff.tests.copy_test_support import FakeCopyType, ScaffoldCopyType, register_copy_types
from uploads.models import Upload


class TestCopyTypesRegistry:
    """Tests for the real, shipped copy-type registry."""

    def test_items_is_registered_first(self):
        """Test that `items` is the first registered copy type."""
        assert copy_types.slugs()[0] == 'items'

    def test_find_items_returns_the_items_copy_type(self):
        """Test that `items` resolves to the `ItemsCopyType` entry."""
        assert isinstance(copy_types.find('items'), ItemsCopyType)

    def test_common_items_is_registered_right_after_items(self):
        """Test that `common_items` is the second registered copy type."""
        assert copy_types.slugs()[:2] == ['items', 'common_items']

    def test_find_common_items_returns_the_common_items_copy_type(self):
        """Test that `common_items` resolves to the `CommonItemsCopyType` entry."""
        assert isinstance(copy_types.find('common_items'), CommonItemsCopyType)

    def test_recipes_is_registered_right_after_common_items(self):
        """Test that `recipes` is the third registered copy type."""
        assert copy_types.slugs()[:3] == ['items', 'common_items', 'recipes']

    def test_find_recipes_returns_the_recipes_copy_type(self):
        """Test that `recipes` resolves to the `RecipesCopyType` entry."""
        assert isinstance(copy_types.find('recipes'), RecipesCopyType)

    def test_find_unknown_slug_returns_none(self):
        """Test that an unregistered slug resolves to None."""
        assert copy_types.find('unknown') is None

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


@pytest.mark.django_db
class TestModelCopyTypeList:
    """Tests for the shared `ModelCopyType.list` behavior."""

    def setup_method(self):
        """Set up a source game with items, a target game and the scaffold copy type."""
        self.copy_type = ScaffoldCopyType()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.first = GameItemFactory(game=self.source, name='First')
        self.second = GameItemFactory(game=self.source, name='Second', hidden=True)
        GameItemFactory(game=self.target, name='Elsewhere')

    def _list(self, query=''):
        """Return the list response for the source/target games."""
        request = RequestFactory().get(f'/staff/copies/items.json{query}')
        return self.copy_type.list(request, self.source, self.target)

    def test_lists_source_rows_ordered_by_id(self):
        """Test that every row of the source game is listed, ordered by id."""
        ids = [row['id'] for row in self._list().data]
        assert ids == [self.first.id, self.second.id]

    def test_base_serializer_class_raises_not_implemented(self):
        """Test that the base `serializer_class` hook is not implemented."""
        with pytest.raises(NotImplementedError):
            ModelCopyType('items', GameItem).serializer_class()

    def test_rows_use_the_serializer_class(self):
        """Test that the rows are serialized with the copy type's serializer."""
        assert self._list().data[0] == {
            'id': self.first.id, 'name': 'First', 'copied_to_target': False,
        }

    def test_copied_to_target_is_true_for_rows_copied_to_target(self):
        """Test that a row with a copy in the target game is flagged copied_to_target."""
        GameItemFactory(game=self.target, copied_from=self.second)
        flags = [row['copied_to_target'] for row in self._list().data]
        assert flags == [False, True]

    def test_copies_in_other_games_do_not_count(self):
        """Test that a copy living in a third game does not flag the row."""
        GameItemFactory(game=GameFactory(game_slug='third'), copied_from=self.first)
        assert self._list().data[0]['copied_to_target'] is False

    def test_paginates_with_headers(self):
        """Test that the list is paginated and carries the paginator headers."""
        response = self._list('?per_page=1&page=2')
        assert [row['id'] for row in response.data] == [self.second.id]
        assert response['page'] == '2'
        assert response['pages'] == '2'
        assert response['per_page'] == '1'
        assert response['total'] == '2'


@pytest.mark.django_db
class TestModelCopyTypeCopy:
    """Tests for the shared `ModelCopyType.copy` behavior."""

    def setup_method(self):
        """Set up a source item, a target game and a copy-origin upload."""
        self.source_game = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.item = GameItemFactory(
            game=self.source_game, name='Sword', description='Sharp', hidden=True,
        )
        self.upload = Upload.objects.create(
            user=UserFactory(), file_path='photos/x.png', origin=Upload.ORIGIN_COPY,
        )
        self.request = RequestFactory().post('/staff/copies/items/1.json')

    def _copy(self, copy_type):
        """Copy the source item into the target game with `copy_type`."""
        return copy_type.copy(self.request, self.item, self.target)

    def _created_copy(self):
        """Return the copy of the source item in the target game."""
        return self.item.copies.get(game=self.target)

    def test_returns_201_with_copy_id_and_no_links(self):
        """Test that the copy answers 201 with the new id and an empty links list."""
        response = self._copy(ScaffoldCopyType())
        assert response.status_code == 201
        assert response.data == {'id': self._created_copy().id, 'links': []}

    def test_copies_fields_game_and_copied_from(self):
        """Test that the copied fields, the target game and copied_from are set."""
        self._copy(ScaffoldCopyType())
        copy = self._created_copy()
        assert (copy.name, copy.description, copy.hidden) == ('Sword', 'Sharp', True)
        assert copy.copied_from == self.item

    def test_uncopied_fields_keep_their_defaults(self):
        """Test that fields outside copied_fields are not copied."""
        self._copy(ScaffoldCopyType())
        assert self._created_copy().photo is None

    def test_copies_the_source_current_state(self):
        """Test that the source is re-read, so its current values are copied."""
        GameItem.objects.filter(pk=self.item.pk).update(name='Renamed')
        self._copy(ScaffoldCopyType())
        assert self._created_copy().name == 'Renamed'

    def test_returns_404_when_source_is_gone(self):
        """Test that a source deleted before the transaction answers 404."""
        copy_type = ScaffoldCopyType()
        GameItem.objects.filter(pk=self.item.pk).delete()
        response = self._copy(copy_type)
        assert response.status_code == 404
        assert copy_type.association_calls == []

    def test_calls_copy_associations_with_source_and_copy(self):
        """Test that the association hook receives the source and the copy."""
        copy_type = ScaffoldCopyType()
        self._copy(copy_type)
        assert copy_type.association_calls == [(self.item, self._created_copy())]

    def test_links_serialize_the_returned_uploads(self):
        """Test that each returned upload becomes a {upload_id, upload_type, token} link."""
        response = self._copy(ScaffoldCopyType(uploads=[self.upload]))
        assert response.data['links'] == [{
            'upload_id': self.upload.id, 'upload_type': 'image', 'token': self.upload.token,
        }]

    def test_attaches_cache_clear_header(self):
        """Test that the cache paths of the copy are sent as X-Cache-Clear."""
        response = self._copy(ScaffoldCopyType(paths=['/a.json', '/b/{id}.json']))
        copy_id = self._created_copy().id
        assert response['X-Cache-Clear'] == f'/a.json, /b/{copy_id}.json'

    def test_no_cache_clear_header_without_paths(self):
        """Test that no X-Cache-Clear header is sent when there are no paths."""
        response = self._copy(ScaffoldCopyType())
        assert 'X-Cache-Clear' not in response

    def test_failing_association_rolls_back_the_copy(self):
        """Test that an error in the association hook rolls the copy back."""
        copy_type = ScaffoldCopyType()
        copy_type.copy_associations = _raise_runtime_error
        with pytest.raises(RuntimeError):
            self._copy(copy_type)
        assert not self.item.copies.exists()


@pytest.mark.django_db
class TestModelCopyTypeCopyInstance:
    """Tests for the public, transaction-agnostic `ModelCopyType.copy_instance`."""

    def setup_method(self):
        """Set up a source item, a target game and a copy-origin upload."""
        self.source_game = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.item = GameItemFactory(game=self.source_game, name='Sword')
        self.upload = Upload.objects.create(
            user=UserFactory(), file_path='photos/x.png', origin=Upload.ORIGIN_COPY,
        )
        self.request = RequestFactory().post('/staff/copies/items/1.json')

    def test_returns_the_copy_and_its_uploads(self):
        """Test that `copy_instance` returns `(copy, uploads)` rather than a Response."""
        copy_type = ScaffoldCopyType(uploads=[self.upload])
        copy, uploads = copy_type.copy_instance(self.request, self.item, self.target)
        assert (copy.game, copy.copied_from, copy.name) == (self.target, self.item, 'Sword')
        assert uploads == [self.upload]

    def test_calls_copy_associations(self):
        """Test that `copy_instance` runs the association hook with the source and copy."""
        copy_type = ScaffoldCopyType()
        copy, _ = copy_type.copy_instance(self.request, self.item, self.target)
        assert copy_type.association_calls == [(self.item, copy)]


@pytest.mark.django_db
class TestCommonItemsCopyType:
    """Tests for the `CommonItemsCopyType` hooks."""

    def setup_method(self):
        """Set up the copy type, a target game and a common item living in it."""
        self.copy_type = CommonItemsCopyType()
        self.target = GameFactory(name='Target', game_slug='target')
        self.copy = GameCommonItemFactory(game=self.target)

    def test_slug_and_model(self):
        """Test that the copy type is registered under `common_items` over GameCommonItem."""
        assert (self.copy_type.slug, self.copy_type.model) == ('common_items', GameCommonItem)

    def test_copied_fields(self):
        """Test that name, price, description, category and hidden are copied."""
        assert self.copy_type.copied_fields == (
            'name', 'price', 'description', 'category', 'hidden',
        )

    def test_cache_paths_are_the_common_item_family(self):
        """Test that the cache paths are the common item family, without available lists."""
        CharacterFactory(game=self.target)
        base = '/games/target/common_items'
        assert self.copy_type.cache_paths(self.copy) == [
            f'{base}.json', f'{base}/all.json', f'{base}/{self.copy.pk}.json',
            f'{base}/{self.copy.pk}/full.json',
        ]


def _raise_runtime_error(*_args):
    """Raise a RuntimeError, standing in for a failing association hook."""
    raise RuntimeError('boom')
