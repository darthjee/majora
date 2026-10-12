"""Tests for the `documents` staff copy type: list, copy, links and finalize endpoints."""

import json
import re

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from games.models import (
    GameDocument,
    GameDocumentFile,
    GameDocumentFilePhoto,
    GameDocumentPage,
    GameDocumentPageHistory,
    GameDocumentPhoto,
)
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory
from staff.copy_document_links import CopyLinkUploadCreator
from staff.tests.copy_test_support import StaffCopyActorsMixin
from uploads.models import Upload

LIST_URL = '/staff/copies/documents.json?from=source&to=target'
SOURCE_UUID = '0f8c2b4e-1a2b-4c3d-8e9f-0123456789ab'
SOURCE_COVER = f'photos/games/source/documents/1/decree_{SOURCE_UUID}.png'
UUID_RE = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'


def _copy_url(document_id):
    """Return the copy URL of the source document `document_id`."""
    return f'/staff/copies/documents/{document_id}.json'


def _document_family(slug, document_id):
    """Return the expected family cache paths of document `document_id` in game `slug`."""
    base, member = f'/games/{slug}/documents', f'/games/{slug}/documents/{document_id}'
    return [
        f'{base}.json', f'{base}/all.json', f'{member}.json', f'{member}/full.json',
        f'{member}/photos.json', f'{member}/photos/all.json', f'{member}/files.json',
        f'{member}/files/all.json',
    ]


def _page_lists(slug, document_id):
    """Return the expected page list cache paths of document `document_id` in game `slug`."""
    base = f'/games/{slug}/documents/{document_id}/pages'
    return [f'{base}.json', f'{base}/all.json']


class DocumentsCopySupport(StaffCopyActorsMixin):
    """Shared games, source document and request helpers for the documents copy tests."""

    def setup_documents(self):
        """Create the actors, a source and a target game, and a source document."""
        self.setup_actors()
        self.source = GameFactory(name='Source', game_slug='source')
        self.target = GameFactory(name='Target', game_slug='target')
        self.document = GameDocumentFactory(
            game=self.source, name='Decree', description='Royal', hidden=True,
        )

    def add_photo(self, ready=True, path='photos/games/source/documents/1/map.png'):
        """Create a gallery photo of the source document."""
        return GameDocumentPhoto.objects.create(
            game_document=self.document, path=path, ready=ready,
        )

    def add_cover(self, ready=True):
        """Create a gallery photo of the source document and make it its cover."""
        photo = self.add_photo(ready=ready, path=SOURCE_COVER)
        self.document.photo = photo
        self.document.save()
        return photo

    def add_file(self, ready=True, photo_ready=None, name='Notes'):
        """Create a file of the source document, with a photo when `photo_ready` is set."""
        photo = None
        if photo_ready is not None:
            photo = GameDocumentFilePhoto.objects.create(
                path='photos/games/source/documents/1/files/9/photo.webp', ready=photo_ready,
            )
        return GameDocumentFile.objects.create(
            game_document=self.document, name=name, ready=ready, photo=photo,
            path=f'files/games/source/documents/1/notes_{SOURCE_UUID}.pdf',
        )

    def copy(self, client, document=None, token=None):
        """POST the copy of `document` (default: the source document) into the target game."""
        document = document or self.document
        return self.post_json(
            client, _copy_url(document.id), {'target': 'target'}, token or self.staff_token,
        )

    def created_copy(self, response):
        """Return the document created by a copy response."""
        return GameDocument.objects.get(pk=response.json()['id'])


@pytest.mark.django_db
class TestStaffCopiesDocumentsList(DocumentsCopySupport):
    """Tests for `GET staff/copies/documents.json`."""

    def setup_method(self):
        """Set up the games and the source document."""
        self.setup_documents()

    def rows(self, client):
        """Return the listed rows."""
        return self.get_json(client, LIST_URL, self.staff_token).json()

    def test_row_fields(self, client):
        """Test that a row carries exactly the documented fields."""
        assert self.rows(client) == [{
            'id': self.document.id, 'name': 'Decree', 'hidden': True, 'photo': None,
            'pages_count': 0, 'photos_count': 0, 'files_count': 0, 'copied_to_target': False,
        }]

    def test_counts_only_ready_photos_and_files(self, client):
        """Test that every page is counted, and only ready photos and files."""
        for order in (1, 2, 3):
            GameDocumentPage.objects.create(game_document=self.document, order=order)
        self.add_photo()
        self.add_photo()
        self.add_photo(ready=False)
        self.add_file()
        self.add_file(ready=False)
        row = self.rows(client)[0]
        assert (row['pages_count'], row['photos_count'], row['files_count']) == (3, 2, 1)

    def test_lists_every_document_ordered_by_id(self, client):
        """Test that every source document, hidden or not, is listed by id."""
        visible = GameDocumentFactory(game=self.source, name='Letter')
        GameDocumentFactory(game=self.target, name='Other')
        assert [row['id'] for row in self.rows(client)] == [self.document.id, visible.id]

    def test_photo_is_the_ready_cover_path(self, client):
        """Test that the row photo is the cover path when the cover is ready."""
        self.add_cover()
        assert self.rows(client)[0]['photo'] == SOURCE_COVER

    def test_photo_is_null_for_not_ready_cover(self, client):
        """Test that a cover being re-uploaded is listed as no photo."""
        self.add_cover(ready=False)
        assert self.rows(client)[0]['photo'] is None

    def test_copied_to_target_flags_copied_documents(self, client):
        """Test that copied_to_target is true once the document has a copy in the target."""
        GameDocumentFactory(game=self.target, copied_from=self.document)
        assert self.rows(client)[0]['copied_to_target'] is True

    def test_is_paginated(self, client):
        """Test that the list sends the paginator headers."""
        response = self.get_json(client, LIST_URL, self.staff_token)
        assert response['total'] == '1'
        assert response['X-Skip-Cache'] == 'true'

    def test_list_queries_do_not_grow_with_rows(self, client):
        """Test that covers and counts are preloaded, so the queries do not grow with rows."""
        self.add_cover()
        self.rows(client)
        single = self._count_queries(client)
        for index in range(3):
            GameDocumentFactory(game=self.source, name=f'Document {index}')
        assert self._count_queries(client) == single

    def test_requires_staff(self, client):
        """Test that a regular user cannot list documents."""
        assert self.get_json(client, LIST_URL, self.regular_token).status_code == 403

    def _count_queries(self, client):
        """Return the number of queries one list request runs."""
        with CaptureQueriesContext(connection) as context:
            self.rows(client)
        return len(context.captured_queries)


@pytest.mark.django_db
class TestStaffCopyDocumentsCreate(DocumentsCopySupport):
    """Tests for `POST staff/copies/documents/<id>.json`: the document and its pages."""

    def setup_method(self):
        """Set up the games and the source document."""
        self.setup_documents()

    def test_copies_fields_into_target(self, client):
        """Test that name, description, hidden, game and copied_from are set on the copy."""
        response = self.copy(client)
        assert response.status_code == 201
        copy = self.created_copy(response)
        assert (copy.name, copy.description, copy.hidden) == ('Decree', 'Royal', True)
        assert (copy.game, copy.copied_from, copy.photo) == (self.target, self.document, None)

    def test_empty_document_returns_no_links(self, client):
        """Test that a document without photos or files is copied with no link."""
        assert self.copy(client).json()['links'] == []
        assert not Upload.objects.exists()

    def test_pages_are_copied_at_version_one(self, client):
        """Test that pages keep order and content, start at version 1, with no history."""
        GameDocumentPage.objects.create(
            game_document=self.document, order=2, content='Second', version=4,
        )
        GameDocumentPage.objects.create(game_document=self.document, order=1, content='First')
        GameDocumentPageHistory.objects.create(game_document=self.document, order=1, version=1)
        copy = self.created_copy(self.copy(client))
        assert list(copy.pages.values_list('order', 'content', 'version')) == [
            (1, 'First', 1), (2, 'Second', 1),
        ]
        assert not copy.page_history.exists()

    def test_name_clash_is_allowed(self, client):
        """Test that a document of the same name in the target does not block the copy."""
        GameDocumentFactory(game=self.target, name='Decree')
        assert self.copy(client).status_code == 201

    def test_superuser_can_copy(self, client):
        """Test that a superuser can copy a document."""
        assert self.copy(client, token=self.superuser_token).status_code == 201

    def test_regular_user_cannot_copy(self, client):
        """Test that a regular user cannot copy a document."""
        assert self.copy(client, token=self.regular_token).status_code == 403
        assert not self.document.copies.exists()

    def test_unknown_source_returns_404(self, client):
        """Test that a missing source document answers 404."""
        response = self.post_json(
            client, _copy_url(self.document.id + 1000), {'target': 'target'}, self.staff_token,
        )
        assert response.status_code == 404

    def test_cache_clear_without_characters(self, client):
        """Test that a target without characters clears the family and the page lists."""
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(
            _document_family('target', copy.id) + _page_lists('target', copy.id)
        )

    def test_cache_clear_lists_every_target_character(self, client):
        """Test that each target PC and NPC gets its documents/available.json cleared."""
        pc = CharacterFactory(game=self.target, npc=False)
        npc = CharacterFactory(game=self.target, npc=True, hidden=True)
        CharacterFactory(game=self.source)
        response = self.copy(client)
        copy = self.created_copy(response)
        assert response['X-Cache-Clear'] == ', '.join(
            _document_family('target', copy.id) + _page_lists('target', copy.id) + [
                f'/games/target/pcs/{pc.pk}/documents/available.json',
                f'/games/target/npcs/{npc.pk}/documents/available.json',
            ]
        )

    def test_failure_rolls_back_the_whole_copy(self, client, monkeypatch):
        """Test that a failure while linking leaves nothing behind."""
        GameDocumentPage.objects.create(game_document=self.document, order=1)
        self.add_cover()
        monkeypatch.setattr(CopyLinkUploadCreator, 'create', _raise_runtime_error)
        with pytest.raises(RuntimeError):
            self.copy(client)
        assert not self.document.copies.exists()
        assert GameDocumentPage.objects.count() == 1
        assert GameDocumentPhoto.objects.count() == 1


@pytest.mark.django_db
class TestStaffCopyDocumentsPhotos(DocumentsCopySupport):
    """Tests for the photo links of a document copy."""

    def setup_method(self):
        """Set up the games and the source document."""
        self.setup_documents()

    def test_cover_and_gallery_photos_are_linked(self, client):
        """Test that every ready photo gets one image link, `is_cover` only for the cover."""
        self.add_cover()
        self.add_photo()
        response = self.copy(client)
        uploads = list(Upload.objects.order_by('id'))
        assert [link['upload_id'] for link in response.json()['links']] == [
            upload.id for upload in uploads
        ]
        assert [(u.upload_type, u.is_cover) for u in uploads] == [
            ('image', True), ('image', False),
        ]

    def test_photo_rows_are_not_ready_at_uuid_paths(self, client):
        """Test that copied photos are not ready, at fresh uuid paths of the copy."""
        self.add_cover()
        copy = self.created_copy(self.copy(client))
        photo = copy.photos.get()
        assert photo.ready is False
        pattern = rf'photos/games/target/documents/{copy.id}/decree_{UUID_RE}\.png'
        assert re.fullmatch(pattern, photo.path)
        assert SOURCE_UUID not in photo.path
        assert copy.photo is None

    def test_not_ready_cover_means_no_cover(self, client):
        """Test that a not-ready cover creates no row and no link."""
        self.add_cover(ready=False)
        copy = self.created_copy(self.copy(client))
        assert not copy.photos.exists()
        assert not Upload.objects.exists()

    def test_not_ready_photo_is_skipped(self, client):
        """Test that a not-ready gallery photo is not copied."""
        self.add_photo(ready=False)
        self.add_photo()
        copy = self.created_copy(self.copy(client))
        assert copy.photos.count() == 1
        assert Upload.objects.get().is_cover is False


@pytest.mark.django_db
class TestStaffCopyDocumentsFiles(DocumentsCopySupport):
    """Tests for the file and file photo links of a document copy."""

    def setup_method(self):
        """Set up the games and the source document."""
        self.setup_documents()

    def test_ready_file_with_ready_photo_gets_two_links(self, client):
        """Test that a file and its photo each get one link, the FK set at copy time."""
        self.add_file(photo_ready=True)
        response = self.copy(client)
        copy = self.created_copy(response)
        file = copy.files.get()
        assert (file.name, file.ready, file.photo.ready) == ('Notes', False, False)
        assert re.fullmatch(rf'files/games/target/documents/{copy.id}/notes_{UUID_RE}\.pdf',
                            file.path)
        assert file.photo.path == (
            f'photos/games/target/documents/{copy.id}/files/{file.id}/photo.webp'
        )
        uploads = list(Upload.objects.order_by('id'))
        assert [(u.upload_type, u.is_cover, u.content_object) for u in uploads] == [
            ('file', False, file), ('image', False, file.photo),
        ]
        assert len(response.json()['links']) == 2

    def test_ready_file_with_not_ready_photo_is_copied_without_photo(self, client):
        """Test that a ready file whose photo is not ready is copied without a photo."""
        self.add_file(photo_ready=False)
        copy = self.created_copy(self.copy(client))
        assert copy.files.get().photo is None
        assert Upload.objects.get().upload_type == 'file'

    def test_not_ready_file_is_skipped_with_its_photo(self, client):
        """Test that a not-ready file is skipped together with its ready photo."""
        self.add_file(ready=False, photo_ready=True)
        copy = self.created_copy(self.copy(client))
        assert not copy.files.exists()
        assert GameDocumentFilePhoto.objects.count() == 1
        assert not Upload.objects.exists()

    def test_link_count_covers_photos_files_and_file_photos(self, client):
        """Test that the `201` links hold one entry per copied photo, file and file photo."""
        self.add_cover()
        self.add_photo()
        self.add_file(photo_ready=True)
        self.add_file(name='Plain')
        assert len(self.copy(client).json()['links']) == 5


@pytest.mark.django_db
class TestStaffCopyDocumentsLinks(DocumentsCopySupport):
    """Tests for the links of a copied document: pending list and finalize."""

    def setup_method(self):
        """Set up the games, a source with cover, photo and file with photo, and an NPC."""
        self.setup_documents()
        self.add_cover()
        self.add_photo()
        self.add_file(photo_ready=True)
        self.npc = CharacterFactory(game=self.target, npc=True)

    def test_pending_links_list_every_link(self, client):
        """Test that every copied link is listed for the target game."""
        response = self.copy(client)
        links = self.get_json(client, '/staff/copies/links.json?to=target', self.staff_token)
        assert [row['upload_id'] for row in links.json()] == [
            link['upload_id'] for link in response.json()['links']
        ]

    def test_cover_finalize_sets_cover_and_clears_available_lists(self, client):
        """Test that finalizing the cover sets the copy's cover and clears available lists."""
        copy = self.created_copy(self.copy(client))
        finalize = self._finalize(client, Upload.objects.get(is_cover=True))
        copy.refresh_from_db()
        assert copy.photo.ready is True
        assert finalize['X-Cache-Clear'] == ', '.join(_document_family('target', copy.id) + [
            f'/games/target/npcs/{self.npc.pk}/documents/available.json',
        ])

    def test_other_finalizes_only_set_ready_and_clear_family(self, client):
        """Test that non-cover photo, file and file photo finalizes clear the family only."""
        copy = self.created_copy(self.copy(client))
        for upload in Upload.objects.filter(is_cover=False).order_by('id'):
            finalize = self._finalize(client, upload)
            upload.content_object.refresh_from_db()
            assert upload.content_object.ready is True
            assert finalize['X-Cache-Clear'] == ', '.join(_document_family('target', copy.id))
        copy.refresh_from_db()
        assert copy.photo is None

    def _finalize(self, client, upload):
        """Advance `upload` to uploading then uploaded, returning the last response."""
        self._patch(client, upload, 'uploading')
        return self._patch(client, upload, 'uploaded')

    def _patch(self, client, upload, status):
        """PATCH the upload status as the staff user holding the link token."""
        return client.patch(
            f'/uploads/{upload.upload_type}/{upload.pk}.json',
            data=json.dumps({'status': status}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.staff_token.key}',
            HTTP_X_UPLOAD_TOKEN=upload.token,
        )


def _raise_runtime_error(*_args, **_kwargs):
    """Raise a RuntimeError, standing in for a failing link creation."""
    raise RuntimeError('boom')
