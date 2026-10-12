"""Tests for the `recipes` staff copy type through the list and copy endpoints."""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from games.models import GameCommonItem, GameCommonItemPhoto, GameRecipe
from games.tests.factories import (
    CharacterFactory,
    CharacterRecipeFactory,
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
)
from staff.copy_types_recipes import RecipesCopyType
from staff.tests.copy_test_support import StaffCopyActorsMixin
from uploads.models import Upload

LIST_URL = '/staff/copies/recipes.json?from=source&to=target'
COVER_PATH = 'photos/games/source/common_items/1/photo.webp'


def _copy_url(recipe_id):
    """Return the copy URL of the source recipe `recipe_id`."""
    return f'/staff/copies/recipes/{recipe_id}.json'


def _recipe_paths(recipe):
    """Return the expected recipe family and common item nested recipe lists of `recipe`."""
    base = '/games/target/recipes'
    nested = f'/games/target/common_items/{recipe.game_common_item_id}/recipes'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{recipe.id}.json',
            f'{base}/{recipe.id}/full.json', f'{nested}.json', f'{nested}/all.json']


def _common_item_family(common_item_id):
    """Return the expected common item family cache paths of `common_item_id` in the target."""
    base = '/games/target/common_items'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{common_item_id}.json',
            f'{base}/{common_item_id}/full.json']


class RecipesCopySupport(StaffCopyActorsMixin):
    """Shared games, source recipe and request helpers for the recipes copy tests."""

    def setup_recipes(self):
        """Create the actors, a source and a target game, and a source recipe."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.common_item = GameCommonItemFactory(
            game=self.source, name='Healing Potion', price=50, description='Heals',
            category=GameCommonItem.CATEGORY_POTION, hidden=True,
        )
        self.recipe = GameRecipeFactory(
            game=self.source, game_common_item=self.common_item, name='Potion Recipe',
            description='Brew it', hidden=True, yield_quantity=2, crafting_time='1 hour',
            crafting_cost=30, ingredients='Herbs', checks='Alchemy DC 12',
        )

    def add_cover(self, common_item, ready=True):
        """Create a cover photo for `common_item` and point its `photo` FK at it."""
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=common_item, path=COVER_PATH, ready=ready,
        )
        common_item.photo = photo
        common_item.save()
        return photo

    def target_copy_of_common_item(self, **kwargs):
        """Create a common item of the target game copied directly from the source one."""
        return GameCommonItemFactory(
            game=self.target, copied_from=self.common_item, **kwargs,
        )

    def copy(self, client, recipe=None, token=None):
        """POST the copy of `recipe` (default: the source one) into the target game."""
        recipe = recipe or self.recipe
        return self.post_json(
            client, _copy_url(recipe.id), {'target': 'target'}, token or self.staff_token,
        )

    def created_copy(self, response):
        """Return the recipe created by a copy response."""
        return GameRecipe.objects.get(pk=response.json()['id'])

    def target_common_items(self):
        """Return the target game's common items, ordered by id."""
        return list(GameCommonItem.objects.filter(game=self.target).order_by('id'))


@pytest.mark.django_db
class TestStaffCopiesRecipesList(RecipesCopySupport):
    """Tests for `GET staff/copies/recipes.json`."""

    def setup_method(self):
        """Set up the games and the source recipe."""
        self.setup_recipes()

    def rows(self, client):
        """Return the listed rows."""
        return self.get_json(client, LIST_URL, self.staff_token).json()

    def test_row_fields(self, client):
        """Test that a row carries its fields and the nested common item, never copied_from."""
        assert self.rows(client) == [{
            'id': self.recipe.id, 'name': 'Potion Recipe', 'hidden': True,
            'yield_quantity': 2, 'crafting_cost': 30,
            'common_item': {
                'id': self.common_item.id, 'name': 'Healing Potion', 'copied_to_target': False,
            },
            'copied_to_target': False,
        }]

    def test_lists_every_recipe_ordered_by_id(self, client):
        """Test that every source recipe, hidden or not, is listed by id."""
        visible = GameRecipeFactory(game=self.source, game_common_item=self.common_item)
        GameRecipeFactory(game=self.target)
        assert [row['id'] for row in self.rows(client)] == [self.recipe.id, visible.id]

    def test_copied_to_target_flags_copied_recipes(self, client):
        """Test that copied_to_target is true once the recipe has a copy in the target."""
        GameRecipeFactory(game=self.target, copied_from=self.recipe)
        assert self.rows(client)[0]['copied_to_target'] is True

    def test_common_item_copied_to_target_flags_reusable_common_items(self, client):
        """Test that the nested flag is true once the common item has a copy in the target."""
        self.target_copy_of_common_item()
        row = self.rows(client)[0]
        assert (row['common_item']['copied_to_target'], row['copied_to_target']) == (True, False)

    def test_common_item_copy_in_another_game_is_ignored(self, client):
        """Test that a common item copy outside the target does not set the nested flag."""
        GameCommonItemFactory(game=GameFactory(game_slug='other'), copied_from=self.common_item)
        assert self.rows(client)[0]['common_item']['copied_to_target'] is False

    def test_is_paginated(self, client):
        """Test that the list sends the paginator headers."""
        response = self.get_json(client, LIST_URL, self.staff_token)
        assert response['total'] == '1'
        assert response['X-Skip-Cache'] == 'true'

    def test_list_queries_do_not_grow_with_rows(self, client):
        """Test that common items are preloaded, so the queries do not grow with the rows."""
        self.rows(client)
        single = self._count_queries(client)
        for index in range(3):
            GameRecipeFactory(game=self.source, name=f'Recipe {index}')
        assert self._count_queries(client) == single

    def test_regular_user_is_forbidden(self, client):
        """Test that the list follows the global staff gate."""
        assert self.get_json(client, LIST_URL, self.regular_token).status_code == 403

    def _count_queries(self, client):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.rows(client)
        return len(context.captured_queries)


@pytest.mark.django_db
class TestStaffCopyRecipesCreate(RecipesCopySupport):
    """Tests for `POST staff/copies/recipes/<id>.json`: the recipe itself."""

    def setup_method(self):
        """Set up the games and the source recipe."""
        self.setup_recipes()

    def test_copies_fields_into_target(self, client):
        """Test that the copied fields, hidden, game and copied_from are set on the copy."""
        response = self.copy(client)
        assert response.status_code == 201
        copy = self.created_copy(response)
        assert (
            copy.name, copy.description, copy.yield_quantity, copy.crafting_time,
            copy.crafting_cost, copy.ingredients, copy.checks, copy.hidden,
        ) == ('Potion Recipe', 'Brew it', 2, '1 hour', 30, 'Herbs', 'Alchemy DC 12', True)
        assert (copy.game, copy.copied_from) == (self.target, self.recipe)

    def test_character_recipes_are_not_copied(self, client):
        """Test that the source's CharacterRecipe rows are not copied."""
        character = CharacterFactory(game=self.source)
        CharacterRecipeFactory(character=character, game_recipe=self.recipe)
        copy = self.created_copy(self.copy(client))
        assert not copy.character_recipes.exists()

    def test_name_clash_is_allowed(self, client):
        """Test that a recipe of the same name in the target does not block the copy."""
        GameRecipeFactory(game=self.target, name='Potion Recipe')
        assert self.copy(client).status_code == 201

    def test_superuser_can_copy(self, client):
        """Test that a superuser can copy a recipe."""
        assert self.copy(client, token=self.superuser_token).status_code == 201

    def test_regular_user_is_forbidden(self, client):
        """Test that the copy follows the global staff gate."""
        assert self.copy(client, token=self.regular_token).status_code == 403

    def test_unknown_source_returns_404(self, client):
        """Test that a missing source recipe answers 404."""
        response = self.post_json(
            client, _copy_url(self.recipe.id + 1000), {'target': 'target'}, self.staff_token,
        )
        assert response.status_code == 404

    def test_failure_rolls_back_recipe_and_common_item(self, client, monkeypatch):
        """Test that a failure creating the recipe also rolls back the copied common item."""
        self.add_cover(self.common_item)
        monkeypatch.setattr(RecipesCopyType, '_create_recipe', _raise_runtime_error)
        with pytest.raises(RuntimeError):
            self.copy(client)
        assert not self.target.recipes.exists()
        assert self.target_common_items() == []
        assert GameCommonItemPhoto.objects.count() == 1
        assert not Upload.objects.exists()


@pytest.mark.django_db
class TestStaffCopyRecipesReuseCommonItem(RecipesCopySupport):
    """Tests for a recipe copy reusing a direct copy of its common item in the target."""

    def setup_method(self):
        """Set up the games, the source recipe and a ready cover on its common item."""
        self.setup_recipes()
        self.add_cover(self.common_item)

    def test_reuses_existing_direct_copy(self, client):
        """Test that the copy points to the existing copy, with no new common item or link."""
        reused = self.target_copy_of_common_item(name='Renamed', price=7)
        response = self.copy(client)
        assert self.created_copy(response).game_common_item == reused
        assert response.json()['links'] == []
        assert self.target_common_items() == [reused]
        assert not Upload.objects.exists()

    def test_reused_common_item_is_unchanged(self, client):
        """Test that the reused common item keeps its fields and gains no photo row."""
        reused = self.target_copy_of_common_item(name='Renamed', price=7)
        self.copy(client)
        reused.refresh_from_db()
        assert (reused.name, reused.price, reused.photo) == ('Renamed', 7, None)
        assert not reused.photos.exists()

    def test_reuses_most_recent_copy(self, client):
        """Test that the highest-id copy is reused among several."""
        self.target_copy_of_common_item()
        newest = self.target_copy_of_common_item()
        assert self.created_copy(self.copy(client)).game_common_item == newest

    def test_copied_from_chain_is_not_walked(self, client):
        """Test that copying B's recipe back into A does not reuse A's original common item."""
        target_common_item = self.target_copy_of_common_item()
        target_recipe = GameRecipeFactory(game=self.target, game_common_item=target_common_item)
        response = self.post_json(
            client, _copy_url(target_recipe.id), {'target': 'source'}, self.staff_token,
        )
        copied = self.created_copy(response).game_common_item
        assert copied != self.common_item
        assert (copied.game, copied.copied_from) == (self.source, target_common_item)

    def test_cache_clear_is_recipe_paths_only(self, client):
        """Test that a reuse clears the recipe family and the reused item's recipe lists."""
        self.target_copy_of_common_item()
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_recipe_paths(copy))


@pytest.mark.django_db
class TestStaffCopyRecipesCopyCommonItem(RecipesCopySupport):
    """Tests for a recipe copy copying its common item when the target has no copy of it."""

    def setup_method(self):
        """Set up the games and the source recipe."""
        self.setup_recipes()

    def test_copies_common_item_fields(self, client):
        """Test that the common item is copied with its fields, hidden and copied_from."""
        common_item = self.created_copy(self.copy(client)).game_common_item
        assert (
            common_item.name, common_item.price, common_item.description,
            common_item.category, common_item.hidden,
        ) == ('Healing Potion', 50, 'Heals', 'potion', True)
        assert (common_item.game, common_item.copied_from) == (self.target, self.common_item)

    def test_ready_cover_returns_one_cover_link(self, client):
        """Test that a ready cover of the copied common item yields one is_cover link."""
        self.add_cover(self.common_item)
        response = self.copy(client)
        common_item = self.created_copy(response).game_common_item
        upload = Upload.objects.get()
        assert response.json()['links'] == [
            {'upload_id': upload.id, 'upload_type': 'image', 'token': upload.token},
        ]
        assert upload.is_cover is True
        assert upload.file_path == (
            f'photos/games/target/common_items/{common_item.id}/photo.webp'
        )

    def test_without_photo_returns_no_links(self, client):
        """Test that a common item without photo is copied with no link."""
        assert self.copy(client).json()['links'] == []
        assert not Upload.objects.exists()

    def test_not_ready_cover_returns_no_link(self, client):
        """Test that a cover being re-uploaded is not linked."""
        self.add_cover(self.common_item, ready=False)
        assert self.copy(client).json()['links'] == []
        assert not Upload.objects.exists()

    def test_sequential_copies_share_one_common_item_copy(self, client):
        """Test that two recipes sharing a common item end up sharing a single copy."""
        other = GameRecipeFactory(game=self.source, game_common_item=self.common_item)
        first = self.created_copy(self.copy(client))
        second = self.created_copy(self.copy(client, recipe=other))
        assert first.game_common_item == second.game_common_item
        assert len(self.target_common_items()) == 1

    def test_cache_clear_adds_the_common_item_family(self, client):
        """Test that a copied common item adds its family to the recipe paths."""
        response = self.copy(client)
        copy = self.created_copy(response)
        expected = _recipe_paths(copy) + _common_item_family(copy.game_common_item_id)
        assert response['X-Cache-Clear'] == ', '.join(expected)


def _raise_runtime_error(*_args):
    """Raise a RuntimeError, standing in for a failing recipe creation."""
    raise RuntimeError('boom')
