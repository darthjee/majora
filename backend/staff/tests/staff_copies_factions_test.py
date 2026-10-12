"""Tests for the `factions` staff copy type: list, copy, links and finalize endpoints."""

import json

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from games.models import GameFaction, GameFactionPhoto
from games.tests.factories import (
    CharacterFactionFactory,
    CharacterFactory,
    GameFactionFactory,
    GameFactory,
)
from staff.copy_photo_links import CoverPhotoLinkBuilder
from staff.tests.copy_test_support import StaffCopyActorsMixin
from uploads.models import Upload

LIST_URL = '/staff/copies/factions.json?from=source&to=target'
SOURCE_COVER = 'photos/games/source/factions/1/photo.jpeg'
NAME_TAKEN = {'errors': {'name': ['unique']}}


def _copy_url(faction_id):
    """Return the copy URL of the source faction `faction_id`."""
    return f'/staff/copies/factions/{faction_id}.json'


def _faction_family(slug, faction_id):
    """Return the expected family cache paths of faction `faction_id` in game `slug`."""
    base = f'/games/{slug}/factions'
    return [f'{base}.json', f'{base}/{faction_id}.json']


class FactionsCopySupport(StaffCopyActorsMixin):
    """Shared games, source faction and request helpers for the factions copy tests."""

    def setup_factions(self):
        """Create the actors, a source and a target game, and a source faction."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.faction = GameFactionFactory(game=self.source, name='Guild')

    def add_cover(self, faction, ready=True, path=SOURCE_COVER):
        """Create a cover photo for `faction` and point its `photo` FK at it."""
        photo = GameFactionPhoto.objects.create(faction=faction, path=path, ready=ready)
        faction.photo = photo
        faction.save()
        return photo

    def copy(self, client, faction=None, token=None):
        """POST the copy of `faction` (default: the source faction) into the target game."""
        faction = faction or self.faction
        return self.post_json(
            client, _copy_url(faction.id), {'target': 'target'}, token or self.staff_token,
        )

    def created_copy(self, response):
        """Return the faction created by a copy response."""
        return GameFaction.objects.get(pk=response.json()['id'])


@pytest.mark.django_db
class TestStaffCopiesFactionsList(FactionsCopySupport):
    """Tests for `GET staff/copies/factions.json`."""

    def setup_method(self):
        """Set up the games and the source faction."""
        self.setup_factions()

    def rows(self, client):
        """Return the listed rows."""
        return self.get_json(client, LIST_URL, self.staff_token).json()

    def test_row_fields(self, client):
        """Test that a row carries id, name, photo, copied_to_target and name_taken_in_target."""
        assert self.rows(client) == [{
            'id': self.faction.id, 'name': 'Guild', 'photo': None,
            'copied_to_target': False, 'name_taken_in_target': False,
        }]

    def test_lists_every_faction_ordered_by_id(self, client):
        """Test that every source faction is listed by id, and no target faction."""
        other = GameFactionFactory(game=self.source, name='Order')
        GameFactionFactory(game=self.target, name='Other')
        assert [row['id'] for row in self.rows(client)] == [self.faction.id, other.id]

    def test_photo_is_the_ready_cover_path(self, client):
        """Test that the row photo is the cover path when the cover is ready."""
        self.add_cover(self.faction)
        assert self.rows(client)[0]['photo'] == SOURCE_COVER

    def test_photo_is_null_for_not_ready_cover(self, client):
        """Test that a cover being re-uploaded is listed as no photo."""
        self.add_cover(self.faction, ready=False)
        assert self.rows(client)[0]['photo'] is None

    def test_copied_to_target_flags_copied_factions(self, client):
        """Test that copied_to_target is true once the faction has a copy in the target."""
        GameFactionFactory(game=self.target, name='Renamed', copied_from=self.faction)
        assert self.rows(client)[0]['copied_to_target'] is True

    def test_name_taken_in_target_flags_a_name_clash(self, client):
        """Test that name_taken_in_target is true when the target has a faction of that name."""
        GameFactionFactory(game=self.target, name='Guild')
        assert self.rows(client)[0]['name_taken_in_target'] is True

    def test_name_taken_in_target_ignores_other_games(self, client):
        """Test that a same-named faction outside the target does not flag the row."""
        GameFactionFactory(game=GameFactory(name='Third', game_slug='third'), name='Guild')
        GameFactionFactory(game=self.target, name='Order')
        assert self.rows(client)[0]['name_taken_in_target'] is False

    def test_is_paginated(self, client):
        """Test that the list sends the paginator headers."""
        response = self.get_json(client, LIST_URL, self.staff_token)
        assert response['total'] == '1'
        assert response['X-Skip-Cache'] == 'true'

    def test_list_queries_do_not_grow_with_rows(self, client):
        """Test that covers are preloaded, so the queries do not grow with the rows."""
        self.add_cover(self.faction)
        self.rows(client)
        single = self._count_queries(client)
        for index in range(3):
            self.add_cover(GameFactionFactory(game=self.source, name=f'Faction {index}'))
        assert self._count_queries(client) == single

    def _count_queries(self, client):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.rows(client)
        return len(context.captured_queries)


@pytest.mark.django_db
class TestStaffCopyFactionsCreate(FactionsCopySupport):
    """Tests for `POST staff/copies/factions/<id>.json`."""

    def setup_method(self):
        """Set up the games and the source faction."""
        self.setup_factions()

    def test_copies_fields_into_target(self, client):
        """Test that name, game and copied_from are set on the copy, with no photo."""
        response = self.copy(client)
        assert response.status_code == 201
        copy = self.created_copy(response)
        assert (copy.name, copy.game, copy.copied_from) == ('Guild', self.target, self.faction)
        assert copy.photo is None

    def test_without_photo_returns_no_links(self, client):
        """Test that a source without photo is copied with no link."""
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not Upload.objects.exists()

    def test_ready_cover_returns_one_cover_link(self, client):
        """Test that a ready cover yields one is_cover link at the copy's fixed path."""
        self.add_cover(self.faction)
        response = self.copy(client)
        copy = self.created_copy(response)
        upload = Upload.objects.get()
        assert response.json()['links'] == [
            {'upload_id': upload.id, 'upload_type': 'image', 'token': upload.token},
        ]
        assert upload.is_cover is True
        assert upload.file_path == f'photos/games/target/factions/{copy.id}/photo.jpeg'
        assert upload.source_path == SOURCE_COVER
        assert upload.user == self.staff_user

    def test_copy_photo_row_is_not_ready(self, client):
        """Test that the copy's photo row is created not ready and is not yet its cover."""
        self.add_cover(self.faction)
        copy = self.created_copy(self.copy(client))
        assert list(copy.photos.values_list('ready', flat=True)) == [False]
        assert copy.photo is None

    def test_not_ready_cover_returns_no_link(self, client):
        """Test that a cover being re-uploaded is not copied."""
        self.add_cover(self.faction, ready=False)
        copy = self.created_copy(self.copy(client))
        assert not copy.photos.exists()
        assert not Upload.objects.exists()

    def test_non_cover_photo_is_ignored(self, client):
        """Test that a GameFactionPhoto that is not the cover is not copied."""
        GameFactionPhoto.objects.create(faction=self.faction, path='photos/orphan.png', ready=True)
        response = self.copy(client)
        assert response.json()['links'] == []
        assert not self.created_copy(response).photos.exists()

    def test_character_factions_are_not_copied(self, client):
        """Test that the source's CharacterFaction rows are not copied."""
        CharacterFactionFactory(game_faction=self.faction)
        copy = self.created_copy(self.copy(client))
        assert not copy.character_factions.exists()

    def test_superuser_can_copy(self, client):
        """Test that a superuser can copy a faction."""
        assert self.copy(client, token=self.superuser_token).status_code == 201

    def test_cache_clear_is_family_only_without_characters(self, client):
        """Test that a target without characters only clears the faction family."""
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_faction_family('target', copy.id))

    def test_cache_clear_lists_every_target_character(self, client):
        """Test that each target PC and NPC gets its factions/available.json cleared."""
        pc = CharacterFactory(game=self.target, npc=False)
        npc = CharacterFactory(game=self.target, npc=True, hidden=True)
        CharacterFactory(game=self.source)
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(_faction_family('target', copy.id) + [
            f'/games/target/pcs/{pc.pk}/factions/available.json',
            f'/games/target/npcs/{npc.pk}/factions/available.json',
        ])

    def test_failure_rolls_back_the_whole_copy(self, client, monkeypatch):
        """Test that a failure while linking the cover leaves nothing behind."""
        self.add_cover(self.faction)
        monkeypatch.setattr(CoverPhotoLinkBuilder, '_create_upload', _raise_runtime_error)
        with pytest.raises(RuntimeError):
            self.copy(client)
        assert not self.faction.copies.exists()
        assert GameFactionPhoto.objects.count() == 1

    def test_unknown_source_returns_404(self, client):
        """Test that a missing source faction answers 404."""
        response = self.post_json(
            client, _copy_url(self.faction.id + 1000), {'target': 'target'}, self.staff_token,
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestStaffCopyFactionsNameClash(FactionsCopySupport):
    """Tests for the `422` answered when the faction name is taken in the target."""

    def setup_method(self):
        """Set up the games and a source faction with a ready cover."""
        self.setup_factions()
        self.add_cover(self.faction)

    def test_name_clash_returns_422(self, client):
        """Test that a same-named target faction answers 422 with the unique name error."""
        GameFactionFactory(game=self.target, name='Guild')
        response = self.copy(client)
        assert response.status_code == 422
        assert response.json() == NAME_TAKEN

    def test_name_clash_creates_nothing(self, client):
        """Test that a name clash creates no faction, photo or Upload."""
        GameFactionFactory(game=self.target, name='Guild')
        self.copy(client)
        self._assert_nothing_created(factions=2)

    def test_name_clash_clears_nothing(self, client):
        """Test that a name clash sends no X-Cache-Clear."""
        GameFactionFactory(game=self.target, name='Guild')
        assert not self.copy(client).has_header('X-Cache-Clear')

    def test_recopy_of_not_renamed_copy_returns_422(self, client):
        """Test that copying the same faction twice answers 422 the second time."""
        assert self.copy(client).status_code == 201
        response = self.copy(client)
        assert response.status_code == 422
        assert response.json() == NAME_TAKEN

    def test_recopy_creates_nothing_more(self, client):
        """Test that a rejected re-copy leaves only the first copy, photo and Upload."""
        self.copy(client)
        self.copy(client)
        assert self.faction.copies.count() == 1
        self._assert_nothing_created(factions=2, photos=2, uploads=1)

    def test_renamed_copy_can_be_copied_again(self, client):
        """Test that the faction can be copied again once its previous copy was renamed."""
        first = self.created_copy(self.copy(client))
        first.name = 'Renamed'
        first.save()
        assert self.copy(client).status_code == 201

    @staticmethod
    def _assert_nothing_created(factions, photos=1, uploads=0):
        """Assert the faction, faction photo and Upload counts."""
        assert GameFaction.objects.count() == factions
        assert GameFactionPhoto.objects.count() == photos
        assert Upload.objects.count() == uploads


@pytest.mark.django_db
class TestStaffCopyFactionsLink(FactionsCopySupport):
    """Tests for the cover link of a copied faction: pending list and finalize."""

    def setup_method(self):
        """Set up the games, a source faction with a ready cover, and a target NPC."""
        self.setup_factions()
        self.add_cover(self.faction)
        self.npc = CharacterFactory(game=self.target, npc=True)

    def test_pending_links_list_the_cover_link(self, client):
        """Test that the copied cover link is listed for the target game via faction__game."""
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
