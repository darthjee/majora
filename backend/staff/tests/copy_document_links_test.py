"""Tests for the document link builders of the staff copies."""

import re

import pytest
from django.contrib.contenttypes.models import ContentType

from games.models import GameDocumentFile, GameDocumentFilePhoto, GameDocumentPhoto
from games.tests.factories import GameDocumentFactory, GameFactory, UserFactory
from staff.copy_document_links import (
    DocumentFileLinkBuilder,
    DocumentFilePhotoLinkBuilder,
    DocumentPhotoLinkBuilder,
    source_filename,
)
from uploads.models import Upload

SOURCE_UUID = '0f8c2b4e-1a2b-4c3d-8e9f-0123456789ab'
UUID_RE = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'


class TestSourceFilename:
    """Tests for `source_filename`."""

    def test_strips_the_uuid_suffix(self):
        """Test that the `_<uuid>` stem suffix is removed, keeping the extension."""
        assert source_filename(f'photos/a/decree_{SOURCE_UUID}.png') == 'decree.png'

    def test_keeps_stem_without_uuid(self):
        """Test that a stem without a uuid suffix is left untouched."""
        assert source_filename('files/a/my_notes.pdf') == 'my_notes.pdf'

    def test_keeps_uuid_not_at_the_end(self):
        """Test that a uuid not right before the extension is kept."""
        name = f'{SOURCE_UUID}_decree.png'
        assert source_filename(f'photos/a/{name}') == name


class DocumentLinkSetup:
    """Shared setup of a source document and its copy in a target game."""

    def setup_method(self):
        """Set up a source document and its copy in a target game."""
        self.user = UserFactory()
        self.target = GameFactory(name='Target', game_slug='target')
        self.source = GameDocumentFactory(game=GameFactory(name='Source', game_slug='source'))
        self.copy = GameDocumentFactory(game=self.target, copied_from=self.source)
        self.segments = ['games', 'target', 'documents', self.copy.id]
        self.prefix = f'games/target/documents/{self.copy.id}'


@pytest.mark.django_db
class TestDocumentPhotoLinkBuilder(DocumentLinkSetup):
    """Tests for `DocumentPhotoLinkBuilder`."""

    def setup_method(self):
        """Set up a ready source photo and the builder."""
        super().setup_method()
        self.source_photo = GameDocumentPhoto.objects.create(
            game_document=self.source, ready=True,
            path=f'photos/games/source/documents/1/decree_{SOURCE_UUID}.png',
        )
        self.builder = DocumentPhotoLinkBuilder(self.user)

    def _build(self, is_cover=False):
        """Build the photo link of the copy."""
        return self.builder.build(self.source_photo, self.copy, self.segments, is_cover=is_cover)

    def test_creates_not_ready_photo_at_uuid_path(self):
        """Test that the photo row is created not ready at a fresh uuid path."""
        self._build()
        photo = GameDocumentPhoto.objects.get(game_document=self.copy)
        assert re.fullmatch(rf'photos/{self.prefix}/decree_{UUID_RE}\.png', photo.path)
        assert photo.ready is False

    def test_does_not_chain_uuids(self):
        """Test that the source uuid is stripped and replaced by a fresh one."""
        path = self._build().file_path
        assert SOURCE_UUID not in path
        assert len(re.findall(UUID_RE, path)) == 1

    def test_upload_fields(self):
        """Test that the upload carries every copy-link field."""
        upload = self._build()
        photo = GameDocumentPhoto.objects.get(game_document=self.copy)
        assert upload.user == self.user
        assert upload.origin == Upload.ORIGIN_COPY
        assert upload.status == Upload.STATUS_PENDING
        assert upload.upload_type == Upload.UPLOAD_TYPE_IMAGE
        assert upload.source_path == self.source_photo.path
        assert upload.file_path == photo.path
        assert upload.is_cover is False
        assert upload.content_type == ContentType.objects.get_for_model(GameDocumentPhoto)
        assert upload.object_id == photo.id

    def test_cover_flag(self):
        """Test that the cover link carries `is_cover=true`."""
        assert self._build(is_cover=True).is_cover is True

    def test_does_not_change_the_copy_cover(self):
        """Test that the copy's cover FK stays null until the link is finalized."""
        self._build(is_cover=True)
        self.copy.refresh_from_db()
        assert self.copy.photo is None

    def test_no_link_for_not_ready_source(self):
        """Test that a not-ready source photo creates neither a row nor a link."""
        self.source_photo.ready = False
        assert self._build() is None
        assert not GameDocumentPhoto.objects.filter(game_document=self.copy).exists()
        assert not Upload.objects.exists()

    def test_no_link_without_source(self):
        """Test that a missing source photo creates neither a row nor a link."""
        assert self.builder.build(None, self.copy, self.segments) is None
        assert not Upload.objects.exists()


@pytest.mark.django_db
class TestDocumentFileLinkBuilder(DocumentLinkSetup):
    """Tests for `DocumentFileLinkBuilder`."""

    def setup_method(self):
        """Set up a ready source file and the builder."""
        super().setup_method()
        self.source_file = GameDocumentFile.objects.create(
            game_document=self.source, ready=True, name='Notes',
            path=f'files/games/source/documents/1/notes_{SOURCE_UUID}.pdf',
        )
        self.builder = DocumentFileLinkBuilder(self.user)

    def _build(self):
        """Build the file link of the copy."""
        return self.builder.build(self.source_file, self.copy, self.segments)

    def test_creates_not_ready_file_at_files_root(self):
        """Test that the file row is created not ready under the files root, keeping its name."""
        file, _ = self._build()
        file.refresh_from_db()
        assert re.fullmatch(rf'files/{self.prefix}/notes_{UUID_RE}\.pdf', file.path)
        assert (file.ready, file.name, file.game_document) == (False, 'Notes', self.copy)
        assert SOURCE_UUID not in file.path

    def test_upload_fields(self):
        """Test that the upload is a pending copy-origin file link."""
        file, upload = self._build()
        assert upload.user == self.user
        assert upload.origin == Upload.ORIGIN_COPY
        assert upload.status == Upload.STATUS_PENDING
        assert upload.upload_type == Upload.UPLOAD_TYPE_FILE
        assert upload.source_path == self.source_file.path
        assert upload.file_path == file.path
        assert upload.is_cover is False
        assert upload.content_object == file

    def test_no_link_for_not_ready_source(self):
        """Test that a not-ready source file creates neither a row nor a link."""
        self.source_file.ready = False
        assert self._build() is None
        assert not GameDocumentFile.objects.filter(game_document=self.copy).exists()
        assert not Upload.objects.exists()


@pytest.mark.django_db
class TestDocumentFilePhotoLinkBuilder(DocumentLinkSetup):
    """Tests for `DocumentFilePhotoLinkBuilder`."""

    def setup_method(self):
        """Set up a ready source file photo, a copied file and the builder."""
        super().setup_method()
        self.source_photo = GameDocumentFilePhoto.objects.create(
            path='photos/games/source/documents/1/files/2/photo.webp', ready=True,
        )
        self.file_copy = GameDocumentFile.objects.create(
            game_document=self.copy, name='Notes', path='files/x.pdf', ready=False,
        )
        self.builder = DocumentFilePhotoLinkBuilder(self.user)

    def _build(self):
        """Build the file photo link of the copied file."""
        return self.builder.build(self.source_photo, self.file_copy, self.segments)

    def _expected_path(self):
        """Return the fixed path the file photo is expected at."""
        return f'photos/{self.prefix}/files/{self.file_copy.id}/photo.webp'

    def test_creates_not_ready_photo_at_fixed_path(self):
        """Test that the file photo row is created not ready at the fixed path."""
        photo = self._build().content_object
        assert (photo.path, photo.ready) == (self._expected_path(), False)

    def test_sets_the_copied_file_photo_fk(self):
        """Test that the copied file's photo FK points at the new row at build time."""
        upload = self._build()
        self.file_copy.refresh_from_db()
        assert self.file_copy.photo == upload.content_object

    def test_upload_fields(self):
        """Test that the upload is a pending copy-origin image link."""
        upload = self._build()
        assert upload.user == self.user
        assert upload.origin == Upload.ORIGIN_COPY
        assert upload.status == Upload.STATUS_PENDING
        assert upload.upload_type == Upload.UPLOAD_TYPE_IMAGE
        assert upload.source_path == self.source_photo.path
        assert upload.file_path == self._expected_path()
        assert upload.is_cover is False

    def test_no_link_for_not_ready_source(self):
        """Test that a not-ready source photo creates no row, no link and no FK."""
        self.source_photo.ready = False
        assert self._build() is None
        self.file_copy.refresh_from_db()
        assert self.file_copy.photo is None
        assert GameDocumentFilePhoto.objects.count() == 1
        assert not Upload.objects.exists()

    def test_no_link_without_source(self):
        """Test that a missing source photo creates neither a row nor a link."""
        assert self.builder.build(None, self.file_copy, self.segments) is None
        assert not Upload.objects.exists()
