"""Tests for the `possessions` staff copy type: list, copy, links and finalize endpoints."""

import json

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from games.models import GamePossession, GamePossessionPhoto
from games.tests.factories import (
    CharacterFactory,
    CharacterPossessionFactory,
    GameFactory,
    GamePossessionFactory,
)
from staff.copy_photo_links import CoverPhotoLinkBuilder
from staff.tests.copy_test_support import StaffCopyActorsMixin
from uploads.models import Upload

LIST_URL = '/staff/copies/possessions.json?from=source&to=target'
SOURCE_COVER = 'photos/games/source/possessions/1/photo.jpeg'


def _copy_url(possession_id):
    """Return the copy URL of the source possession `possession_id`."""
    return f'/staff/copies/possessions/{possession_id}.json'


def _possession_family(slug, possession_id):
    """Return the expected family cache paths of possession `possession_id` in game `slug`."""
    base = f'/games/{slug}/possessions'
    return [f'{base}.json', f'{base}/all.json', f'{base}/{possession_id}.json',
            f'{base}/{possession_id}/full.json']


class PossessionsCopySupport(StaffCopyActorsMixin):
    """Shared games, source possession and request helpers for the possessions copy tests."""

    def setup_possessions(self):
        """Create the actors, a source and a target game, and a source possession."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.possession = GamePossessionFactory(
            game=self.source, name='Ring', description='Shiny', hidden=True,
        )

    def add_cover(self, possession, ready=True, path=SOURCE_COVER):
        """Create a cover photo for `possession` and point its `photo` FK at it."""
        photo = GamePossessionPhoto.objects.create(
            game_possession=possession, path=path, ready=ready,
        )
        possession.photo = photo
        possession.save()
        return photo

    def copy(self, client, possession=None, token=None):
        """POST the copy of `possession` (default: the source possession) into the target game."""
        possession = possession or self.possession
        return self.post_json(
            client, _copy_url(possession.id), {'target': 'target'}, token or self.staff_token,
        )

    def created_copy(self, response):
        """Return the possession created by a copy response."""
        return GamePossession.objects.get(pk=response.json()['id'])


@pytest.mark.django_db
class TestStaffCopiesPossessionsList(PossessionsCopySupport):
    """Tests for `GET staff/copies/possessions.json`."""

    def setup_method(self):
        """Set up the games and the source possession."""
        self.setup_possessions()

    def rows(self, client):
        """Return the listed rows."""
        return self.get_json(client, LIST_URL, self.staff_token).json()

    def test_row_fields(self, client):
        """Test that a row carries id, name, hidden, photo and copied_to_target only."""
        assert self.rows(client) == [{
            'id': self.possession.id, 'name': 'Ring', 'hidden': True, 'photo': None,
            'copied_to_target': False,
        }]

    def test_lists_every_possession_ordered_by_id(self, client):
        """Test that every source possession, hidden or not, is listed by id."""
        visible = GamePossessionFactory(game=self.source, name='Amulet')
        GamePossessionFactory(game=self.target, name='Other')
        assert [row['id'] for row in self.rows(client)] == [self.possession.id, visible.id]

    def test_photo_is_the_ready_cover_path(self, client):
        """Test that the row photo is the cover path when the cover is ready."""
        self.add_cover(self.possession)
        assert self.rows(client)[0]['photo'] == SOURCE_COVER

    def test_photo_is_null_for_not_ready_cover(self, client):
        """Test that a cover being re-uploaded is listed as no photo."""
        self.add_cover(self.possession, ready=False)
        assert self.rows(client)[0]['photo'] is None

    def test_copied_to_target_flags_copied_possessions(self, client):
        """Test that copied_to_target is true once the possession has a copy in the target."""
        GamePossessionFactory(game=self.target, copied_from=self.possession)
        assert self.rows(client)[0]['copied_to_target'] is True

    def test_is_paginated(self, client):
        """Test that the list sends the paginator headers."""
        response = self.get_json(client, LIST_URL, self.staff_token)
        assert response['total'] == '1'
        assert response['X-Skip-Cache'] == 'true'

    def test_list_queries_do_not_grow_with_rows(self, client):
        """Test that covers are preloaded, so the queries do not grow with the rows."""
        self.add_cover(self.possession)
        self.rows(client)
        single = self._count_queries(client)
        for index in range(3):
            self.add_cover(GamePossessionFactory(game=self.source, name=f'Possession {index}'))
        assert self._count_queries(client) == single

    def _count_queries(self, client):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.rows(client)
        return len(context.captured_queries)


@pytest.mark.django_db
class TestStaffCopyPossessionsCreate(PossessionsCopySupport):
    """Tests for `POST staff/copies/possessions/<id>.json`."""

    def setup_method(self):
        """Set up the games and the source possession."""
        self.setup_possessions()

    def test_copies_fields_into_target(self, client):
        """Test that name, description, hidden, game and copied_from are set on the copy."""
        response = self.copy(client)
        assert response.status_code == 201
        copy = self.created_copy(response)
        assert (copy.name, copy.description, copy.hidden) == ('Ring', 'Shiny', True)
        assert (copy.game, copy.copied_from, copy.photo) == (self.target, self.possession, None)

    def test_without_photo_returns_no_links(self, client):
        """Test that a source without photo is copied with no link."""
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not Upload.objects.exists()

    def test_ready_cover_returns_one_cover_link(self, client):
        """Test that a ready cover yields one is_cover link at the copy's path."""
        self.add_cover(self.possession)
        response = self.copy(client)
        copy = self.created_copy(response)
        upload = Upload.objects.get()
        assert response.json()['links'] == [
            {'upload_id': upload.id, 'upload_type': 'image', 'token': upload.token},
        ]
        assert upload.is_cover is True
        assert upload.file_path == f'photos/games/target/possessions/{copy.id}/photo.jpeg'
        assert upload.source_path == SOURCE_COVER
        assert upload.user == self.staff_user

    def test_copy_photo_row_is_not_ready(self, client):
        """Test that the copy's photo row is created not ready and is not yet its cover."""
        self.add_cover(self.possession)
        copy = self.created_copy(self.copy(client))
        assert list(copy.photos.values_list('ready', flat=True)) == [False]
        assert copy.photo is None

    def test_not_ready_cover_returns_no_link(self, client):
        """Test that a cover being re-uploaded is not copied."""
        self.add_cover(self.possession, ready=False)
        copy = self.created_copy(self.copy(client))
        assert not copy.photos.exists()
        assert not Upload.objects.exists()

    def test_non_cover_photo_is_ignored(self, client):
        """Test that a GamePossessionPhoto that is not the cover is not copied."""
        GamePossessionPhoto.objects.create(
            game_possession=self.possession, path='photos/orphan.png', ready=True,
        )
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not self.created_copy(response).photos.exists()

    def test_character_possessions_are_not_copied(self, client):
        """Test that the source's CharacterPossession rows are not copied."""
        CharacterPossessionFactory(game_possession=self.possession)
        copy = self.created_copy(self.copy(client))
        assert not copy.character_possessions.exists()

    def test_name_clash_is_allowed(self, client):
        """Test that a possession of the same name in the target does not block the copy."""
        GamePossessionFactory(game=self.target, name='Ring')
        assert self.copy(client).status_code == 201

    def test_superuser_can_copy(self, client):
        """Test that a superuser can copy a possession."""
        assert self.copy(client, token=self.superuser_token).status_code == 201

    def test_cache_clear_is_family_only_without_characters(self, client):
        """Test that a target without characters only clears the possession family."""
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_possession_family('target', copy.id))

    def test_cache_clear_lists_every_target_character(self, client):
        """Test that each target PC and NPC gets its possessions/available.json cleared."""
        pc = CharacterFactory(game=self.target, npc=False)
        npc = CharacterFactory(game=self.target, npc=True, hidden=True)
        CharacterFactory(game=self.source)
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_possession_family('target', copy.id) + [
            f'/games/target/pcs/{pc.pk}/possessions/available.json',
            f'/games/target/npcs/{npc.pk}/possessions/available.json',
        ])

    def test_failure_rolls_back_the_whole_copy(self, client, monkeypatch):
        """Test that a failure while linking the cover leaves nothing behind."""
        self.add_cover(self.possession)
        monkeypatch.setattr(CoverPhotoLinkBuilder, '_create_upload', _raise_runtime_error)
        with pytest.raises(RuntimeError):
            self.copy(client)
        assert not self.possession.copies.exists()
        assert GamePossessionPhoto.objects.count() == 1

    def test_unknown_source_returns_404(self, client):
        """Test that a missing source possession answers 404."""
        response = self.post_json(
            client, _copy_url(self.possession.id + 1000), {'target': 'target'}, self.staff_token,
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestStaffCopyPossessionsLink(PossessionsCopySupport):
    """Tests for the cover link of a copied possession: pending list and finalize."""

    def setup_method(self):
        """Set up the games, a source possession with a ready cover, and copy it."""
        self.setup_possessions()
        self.add_cover(self.possession)
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
