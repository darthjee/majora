"""Tests for the `items` staff copy type through the list, copy, links and finalize endpoints."""

import json

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from games.models import GameItem, GameItemPhoto
from games.tests.factories import (
    CharacterFactory,
    CharacterItemFactory,
    GameFactory,
    GameItemFactory,
)
from staff.copy_photo_links import CoverPhotoLinkBuilder
from staff.tests.copy_test_support import StaffCopyActorsMixin
from uploads.models import Upload

LIST_URL = '/staff/copies/items.json?from=source&to=target'


def _copy_url(item_id):
    """Return the copy URL of the source item `item_id`."""
    return f'/staff/copies/items/{item_id}.json'


def _item_family(slug, item_id):
    """Return the expected item family cache paths of item `item_id` in game `slug`."""
    base = f'/games/{slug}/items'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{item_id}.json',
            f'{base}/{item_id}/full.json']


class ItemsCopySupport(StaffCopyActorsMixin):
    """Shared games, source item and request helpers for the items copy tests."""

    def setup_items(self):
        """Create the actors, a source and a target game, and a source item."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.item = GameItemFactory(
            game=self.source, name='Sword', description='Sharp', hidden=True,
        )

    def add_cover(self, item, ready=True, path='photos/games/source/items/1/photo.jpeg'):
        """Create a cover photo for `item` and point its `photo` FK at it."""
        photo = GameItemPhoto.objects.create(game_item=item, path=path, ready=ready)
        item.photo = photo
        item.save()
        return photo

    def copy(self, client, item=None, token=None):
        """POST the copy of `item` (default: the source item) into the target game."""
        item = item or self.item
        return self.post_json(
            client, _copy_url(item.id), {'target': 'target'}, token or self.staff_token,
        )

    def created_copy(self, response):
        """Return the item created by a copy response."""
        return GameItem.objects.get(pk=response.json()['id'])


@pytest.mark.django_db
class TestStaffCopiesItemsList(ItemsCopySupport):
    """Tests for `GET staff/copies/items.json`."""

    def setup_method(self):
        """Set up the games and the source item."""
        self.setup_items()

    def rows(self, client):
        """Return the listed rows."""
        return self.get_json(client, LIST_URL, self.staff_token).json()

    def test_row_fields(self, client):
        """Test that a row carries id, name, hidden, photo and copied_to_target only."""
        assert self.rows(client) == [{
            'id': self.item.id, 'name': 'Sword', 'hidden': True, 'photo': None,
            'copied_to_target': False,
        }]

    def test_lists_every_item_ordered_by_id(self, client):
        """Test that every source item, hidden or not, is listed by id."""
        visible = GameItemFactory(game=self.source, name='Shield')
        GameItemFactory(game=self.target, name='Other')
        assert [row['id'] for row in self.rows(client)] == [self.item.id, visible.id]

    def test_photo_is_the_ready_cover_path(self, client):
        """Test that the row photo is the cover path when the cover is ready."""
        self.add_cover(self.item)
        assert self.rows(client)[0]['photo'] == 'photos/games/source/items/1/photo.jpeg'

    def test_photo_is_null_for_not_ready_cover(self, client):
        """Test that a cover being re-uploaded is listed as no photo."""
        self.add_cover(self.item, ready=False)
        assert self.rows(client)[0]['photo'] is None

    def test_copied_to_target_flags_copied_items(self, client):
        """Test that copied_to_target is true once the item has a copy in the target."""
        GameItemFactory(game=self.target, copied_from=self.item)
        assert self.rows(client)[0]['copied_to_target'] is True

    def test_is_paginated(self, client):
        """Test that the list sends the paginator headers."""
        response = self.get_json(client, LIST_URL, self.staff_token)
        assert response['total'] == '1'
        assert response['X-Skip-Cache'] == 'true'

    def test_list_queries_do_not_grow_with_rows(self, client):
        """Test that covers are preloaded, so the queries do not grow with the rows."""
        self.add_cover(self.item)
        self.rows(client)
        single = self._count_queries(client)
        for index in range(3):
            self.add_cover(GameItemFactory(game=self.source, name=f'Item {index}'))
        assert self._count_queries(client) == single

    def _count_queries(self, client):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.rows(client)
        return len(context.captured_queries)


@pytest.mark.django_db
class TestStaffCopyItemsCreate(ItemsCopySupport):
    """Tests for `POST staff/copies/items/<id>.json`."""

    def setup_method(self):
        """Set up the games and the source item."""
        self.setup_items()

    def test_copies_fields_into_target(self, client):
        """Test that name, description, hidden, game and copied_from are set on the copy."""
        response = self.copy(client)
        assert response.status_code == 201
        copy = self.created_copy(response)
        assert (copy.name, copy.description, copy.hidden) == ('Sword', 'Sharp', True)
        assert (copy.game, copy.copied_from, copy.photo) == (self.target, self.item, None)

    def test_without_photo_returns_no_links(self, client):
        """Test that a source without photo is copied with no link."""
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not Upload.objects.exists()

    def test_ready_cover_returns_one_cover_link(self, client):
        """Test that a ready cover yields one is_cover link at the copy's path."""
        self.add_cover(self.item)
        response = self.copy(client)
        copy = self.created_copy(response)
        upload = Upload.objects.get()
        assert response.json()['links'] == [
            {'upload_id': upload.id, 'upload_type': 'image', 'token': upload.token},
        ]
        assert upload.is_cover is True
        assert upload.file_path == f'photos/games/target/items/{copy.id}/photo.jpeg'
        assert upload.source_path == 'photos/games/source/items/1/photo.jpeg'
        assert upload.user == self.staff_user

    def test_copy_photo_row_is_not_ready(self, client):
        """Test that the copy's photo row is created not ready and is not yet its cover."""
        self.add_cover(self.item)
        copy = self.created_copy(self.copy(client))
        assert list(copy.photos.values_list('ready', flat=True)) == [False]
        assert copy.photo is None

    def test_not_ready_cover_returns_no_link(self, client):
        """Test that a cover being re-uploaded is not copied."""
        self.add_cover(self.item, ready=False)
        copy = self.created_copy(self.copy(client))
        assert not copy.photos.exists()
        assert not Upload.objects.exists()

    def test_non_cover_photo_is_ignored(self, client):
        """Test that a GameItemPhoto that is not the cover is not copied."""
        GameItemPhoto.objects.create(game_item=self.item, path='photos/orphan.png', ready=True)
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not self.created_copy(response).photos.exists()

    def test_character_items_are_not_copied(self, client):
        """Test that the source's CharacterItem rows are not copied."""
        CharacterItemFactory(game_item=self.item)
        copy = self.created_copy(self.copy(client))
        assert not copy.character_items.exists()

    def test_name_clash_is_allowed(self, client):
        """Test that an item of the same name in the target does not block the copy."""
        GameItemFactory(game=self.target, name='Sword')
        assert self.copy(client).status_code == 201

    def test_superuser_can_copy(self, client):
        """Test that a superuser can copy an item."""
        assert self.copy(client, token=self.superuser_token).status_code == 201

    def test_cache_clear_is_family_only_without_characters(self, client):
        """Test that a target without characters only clears the item family."""
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_item_family('target', copy.id))

    def test_cache_clear_lists_every_target_character(self, client):
        """Test that each target PC and NPC gets its items/available.json cleared."""
        pc = CharacterFactory(game=self.target, npc=False)
        npc = CharacterFactory(game=self.target, npc=True, hidden=True)
        CharacterFactory(game=self.source)
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_item_family('target', copy.id) + [
            f'/games/target/pcs/{pc.pk}/items/available.json',
            f'/games/target/npcs/{npc.pk}/items/available.json',
        ])

    def test_failure_rolls_back_the_whole_copy(self, client, monkeypatch):
        """Test that a failure while linking the cover leaves nothing behind."""
        self.add_cover(self.item)
        monkeypatch.setattr(CoverPhotoLinkBuilder, '_create_upload', _raise_runtime_error)
        with pytest.raises(RuntimeError):
            self.copy(client)
        assert not self.item.copies.exists()
        assert GameItemPhoto.objects.count() == 1

    def test_unknown_source_returns_404(self, client):
        """Test that a missing source item answers 404."""
        response = self.post_json(
            client, _copy_url(self.item.id + 1000), {'target': 'target'}, self.staff_token,
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestStaffCopyItemsLink(ItemsCopySupport):
    """Tests for the cover link of a copied item: pending list and finalize."""

    def setup_method(self):
        """Set up the games, a source item with a ready cover, and copy it."""
        self.setup_items()
        self.add_cover(self.item)
        self.npc = CharacterFactory(game=self.target, npc=True)

    def test_pending_links_list_the_cover_link(self, client):
        """Test that the copied cover link is listed for the target game."""
        response = self.copy(client)
        link = response.json()['links'][0]
        links = self.get_json(client, '/staff/copies/links.json?to=target', self.staff_token)
        assert [row['upload_id'] for row in links.json()] == [link['upload_id']]

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
