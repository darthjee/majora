"""Tests for the `common_items` staff copy type through the list, copy and links endpoints."""

import json

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from games.models import GameCommonItem, GameCommonItemPhoto
from games.tests.factories import (
    CharacterFactory,
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
)
from staff.copy_photo_links import CoverPhotoLinkBuilder
from staff.tests.copy_test_support import StaffCopyActorsMixin
from uploads.models import Upload

LIST_URL = '/staff/copies/common_items.json?from=source&to=target'
COVER_PATH = 'photos/games/source/common_items/1/photo.webp'


def _copy_url(common_item_id):
    """Return the copy URL of the source common item `common_item_id`."""
    return f'/staff/copies/common_items/{common_item_id}.json'


def _common_item_family(slug, common_item_id):
    """Return the expected common item family cache paths of `common_item_id` in game `slug`."""
    base = f'/games/{slug}/common_items'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{common_item_id}.json',
            f'{base}/{common_item_id}/full.json']


class CommonItemsCopySupport(StaffCopyActorsMixin):
    """Shared games, source common item and request helpers for the common items copy tests."""

    def setup_common_items(self):
        """Create the actors, a source and a target game, and a source common item."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.common_item = GameCommonItemFactory(
            game=self.source, name='Healing Potion', price=50, description='Heals',
            category=GameCommonItem.CATEGORY_POTION, hidden=True,
        )

    def add_cover(self, common_item, ready=True, path=COVER_PATH):
        """Create a cover photo for `common_item` and point its `photo` FK at it."""
        photo = GameCommonItemPhoto.objects.create(
            game_common_item=common_item, path=path, ready=ready,
        )
        common_item.photo = photo
        common_item.save()
        return photo

    def copy(self, client, common_item=None, token=None):
        """POST the copy of `common_item` (default: the source one) into the target game."""
        common_item = common_item or self.common_item
        return self.post_json(
            client, _copy_url(common_item.id), {'target': 'target'},
            token or self.staff_token,
        )

    def created_copy(self, response):
        """Return the common item created by a copy response."""
        return GameCommonItem.objects.get(pk=response.json()['id'])


@pytest.mark.django_db
class TestStaffCopiesCommonItemsList(CommonItemsCopySupport):
    """Tests for `GET staff/copies/common_items.json`."""

    def setup_method(self):
        """Set up the games and the source common item."""
        self.setup_common_items()

    def rows(self, client):
        """Return the listed rows."""
        return self.get_json(client, LIST_URL, self.staff_token).json()

    def test_row_fields(self, client):
        """Test that a row carries id, name, raw category, price, hidden, photo and flag."""
        assert self.rows(client) == [{
            'id': self.common_item.id, 'name': 'Healing Potion', 'category': 'potion',
            'price': 50, 'hidden': True, 'photo': None, 'copied_to_target': False,
        }]

    def test_lists_every_common_item_ordered_by_id(self, client):
        """Test that every source common item, hidden or not, is listed by id."""
        visible = GameCommonItemFactory(game=self.source, name='Rope')
        GameCommonItemFactory(game=self.target, name='Other')
        assert [row['id'] for row in self.rows(client)] == [self.common_item.id, visible.id]

    def test_photo_is_the_ready_cover_path(self, client):
        """Test that the row photo is the cover path when the cover is ready."""
        self.add_cover(self.common_item)
        assert self.rows(client)[0]['photo'] == COVER_PATH

    def test_photo_is_null_for_not_ready_cover(self, client):
        """Test that a cover being re-uploaded is listed as no photo."""
        self.add_cover(self.common_item, ready=False)
        assert self.rows(client)[0]['photo'] is None

    def test_copied_to_target_flags_copied_common_items(self, client):
        """Test that copied_to_target is true once the common item has a copy in the target."""
        GameCommonItemFactory(game=self.target, copied_from=self.common_item)
        assert self.rows(client)[0]['copied_to_target'] is True

    def test_is_paginated(self, client):
        """Test that the list sends the paginator headers."""
        response = self.get_json(client, LIST_URL, self.staff_token)
        assert response['total'] == '1'
        assert response['X-Skip-Cache'] == 'true'

    def test_list_queries_do_not_grow_with_rows(self, client):
        """Test that covers are preloaded, so the queries do not grow with the rows."""
        self.add_cover(self.common_item)
        self.rows(client)
        single = self._count_queries(client)
        for index in range(3):
            self.add_cover(GameCommonItemFactory(game=self.source, name=f'Item {index}'))
        assert self._count_queries(client) == single

    def _count_queries(self, client):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.rows(client)
        return len(context.captured_queries)


@pytest.mark.django_db
class TestStaffCopyCommonItemsCreate(CommonItemsCopySupport):
    """Tests for `POST staff/copies/common_items/<id>.json`."""

    def setup_method(self):
        """Set up the games and the source common item."""
        self.setup_common_items()

    def test_copies_fields_into_target(self, client):
        """Test that the copied fields, game and copied_from are set on the copy."""
        response = self.copy(client)
        assert response.status_code == 201
        copy = self.created_copy(response)
        assert (copy.name, copy.price, copy.description, copy.category, copy.hidden) == (
            'Healing Potion', 50, 'Heals', 'potion', True,
        )
        assert (copy.game, copy.copied_from, copy.photo) == (
            self.target, self.common_item, None,
        )

    def test_without_photo_returns_no_links(self, client):
        """Test that a source without photo is copied with no link."""
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not Upload.objects.exists()

    def test_ready_cover_returns_one_cover_link(self, client):
        """Test that a ready cover yields one is_cover link at the copy's path."""
        self.add_cover(self.common_item)
        response = self.copy(client)
        copy = self.created_copy(response)
        upload = Upload.objects.get()
        assert response.json()['links'] == [
            {'upload_id': upload.id, 'upload_type': 'image', 'token': upload.token},
        ]
        assert upload.is_cover is True
        assert upload.file_path == f'photos/games/target/common_items/{copy.id}/photo.webp'
        assert upload.source_path == COVER_PATH
        assert upload.user == self.staff_user

    def test_copy_photo_row_is_not_ready(self, client):
        """Test that the copy's photo row is created not ready and is not yet its cover."""
        self.add_cover(self.common_item)
        copy = self.created_copy(self.copy(client))
        assert list(copy.photos.values_list('ready', flat=True)) == [False]
        assert copy.photo is None

    def test_not_ready_cover_returns_no_link(self, client):
        """Test that a cover being re-uploaded is not copied."""
        self.add_cover(self.common_item, ready=False)
        copy = self.created_copy(self.copy(client))
        assert not copy.photos.exists()
        assert not Upload.objects.exists()

    def test_non_cover_photo_is_ignored(self, client):
        """Test that a GameCommonItemPhoto that is not the cover is not copied."""
        GameCommonItemPhoto.objects.create(
            game_common_item=self.common_item, path='photos/orphan.png', ready=True,
        )
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not self.created_copy(response).photos.exists()

    def test_recipes_are_not_copied(self, client):
        """Test that the source's GameRecipe rows are not copied."""
        GameRecipeFactory(game=self.source, game_common_item=self.common_item)
        copy = self.created_copy(self.copy(client))
        assert not copy.recipes.exists()
        assert not self.target.recipes.exists()

    def test_name_clash_is_allowed(self, client):
        """Test that a common item of the same name in the target does not block the copy."""
        GameCommonItemFactory(game=self.target, name='Healing Potion')
        assert self.copy(client).status_code == 201

    def test_superuser_can_copy(self, client):
        """Test that a superuser can copy a common item."""
        assert self.copy(client, token=self.superuser_token).status_code == 201

    def test_cache_clear_is_the_common_item_family(self, client):
        """Test that the copy clears the common item family only, even with characters."""
        CharacterFactory(game=self.target, npc=False)
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_common_item_family('target', copy.id))

    def test_failure_rolls_back_the_whole_copy(self, client, monkeypatch):
        """Test that a failure while linking the cover leaves nothing behind."""
        self.add_cover(self.common_item)
        monkeypatch.setattr(CoverPhotoLinkBuilder, '_create_upload', _raise_runtime_error)
        with pytest.raises(RuntimeError):
            self.copy(client)
        assert not self.common_item.copies.exists()
        assert GameCommonItemPhoto.objects.count() == 1

    def test_unknown_source_returns_404(self, client):
        """Test that a missing source common item answers 404."""
        response = self.post_json(
            client, _copy_url(self.common_item.id + 1000), {'target': 'target'},
            self.staff_token,
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestStaffCopyCommonItemsLink(CommonItemsCopySupport):
    """Tests for the cover link of a copied common item: pending list and finalize."""

    def setup_method(self):
        """Set up the games and a source common item with a ready cover."""
        self.setup_common_items()
        self.add_cover(self.common_item)

    def test_pending_links_list_the_cover_link(self, client):
        """Test that the copied cover link is listed for the target game."""
        response = self.copy(client)
        link = response.json()['links'][0]
        links = self.get_json(client, '/staff/copies/links.json?to=target', self.staff_token)
        assert [row['upload_id'] for row in links.json()] == [link['upload_id']]

    def test_pending_links_are_not_listed_for_other_games(self, client):
        """Test that the copied cover link is not listed for the source game."""
        self.copy(client)
        links = self.get_json(client, '/staff/copies/links.json?to=source', self.staff_token)
        assert links.json() == []

    def test_finalize_sets_cover_and_sends_same_cache_clear(self, client):
        """Test that finalizing the link sets the copy's cover with the copy's X-Cache-Clear."""
        response = self.copy(client)
        copy = self.created_copy(response)
        upload = Upload.objects.get(pk=response.json()['links'][0]['upload_id'])
        self._patch(client, upload, 'uploading')
        finalize = self._patch(client, upload, 'uploaded')
        copy.refresh_from_db()
        assert copy.photo.ready is True
        assert finalize['X-Cache-Clear'] == response['X-Cache-Clear']

    def _patch(self, client, upload, status):
        """PATCH the upload status as the staff user holding the link token."""
        return client.patch(
            f'/uploads/image/{upload.pk}.json',
            data=json.dumps({'status': status}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.staff_token.key}',
            HTTP_X_UPLOAD_TOKEN=upload.token,
        )


def _raise_runtime_error(*_args):
    """Raise a RuntimeError, standing in for a failing link creation."""
    raise RuntimeError('boom')
