"""Tests for the `pre_delete` cleanup of copy-origin uploads."""

import pytest

from games.models import GameDocumentFile, GameDocumentFilePhoto, GamePhoto
from games.tests.factories import GameDocumentFactory, GameFactory, UserFactory
from staff.tests.photo_builders import PhotoBuilder
from uploads.models import Upload


@pytest.mark.django_db
class TestCopyUploadCleanup:
    """Tests for deleting copy uploads along with their copied rows."""

    def setup_method(self):
        """Create a user, a game and a photo builder."""
        self.user = UserFactory(username='staffer', is_staff=True)
        self.game = GameFactory(name='Target Game')
        self.builder = PhotoBuilder(game=self.game)

    def _upload(self, row, origin=Upload.ORIGIN_COPY):
        """Create an upload of the given origin linked to `row`."""
        return Upload.objects.create(
            user=self.user, content_object=row, origin=origin, file_path='photos/x.png'
        )

    def _exists(self, upload):
        """Return True if `upload` is still stored."""
        return Upload.objects.filter(pk=upload.pk).exists()

    def test_deleting_photo_removes_its_copy_uploads(self):
        """Test that deleting a copied photo deletes its copy uploads."""
        photo, _ = self.builder.build('game_item')
        upload = self._upload(photo)
        photo.delete()
        assert not self._exists(upload)

    def test_deleting_photo_keeps_regular_and_staff_uploads(self):
        """Test that regular and staff uploads survive the row deletion."""
        photo, _ = self.builder.build('game_item')
        regular = self._upload(photo, origin=Upload.ORIGIN_REGULAR)
        staff = self._upload(photo, origin=Upload.ORIGIN_STAFF)
        photo.delete()
        assert self._exists(regular)
        assert self._exists(staff)

    def test_deleting_photo_keeps_other_rows_copy_uploads(self):
        """Test that the copy uploads of another row are untouched."""
        photo, _ = self.builder.build('game_item')
        other, _ = self.builder.build('game_item')
        other_upload = self._upload(other)
        photo.delete()
        assert self._exists(other_upload)

    def test_deleting_document_file_removes_its_copy_uploads(self):
        """Test that deleting a document file deletes its copy uploads."""
        document_file = GameDocumentFile.objects.create(
            game_document=GameDocumentFactory(game=self.game), path='files/a.pdf'
        )
        upload = self._upload(document_file)
        document_file.delete()
        assert not self._exists(upload)

    def test_deleting_document_file_photo_removes_its_copy_uploads(self):
        """Test that deleting a document-file photo deletes its copy uploads."""
        photo = GameDocumentFilePhoto.objects.create(path='photos/f.png')
        upload = self._upload(photo)
        photo.delete()
        assert not self._exists(upload)

    def test_deleting_game_removes_copy_uploads_of_its_rows(self):
        """Test that deleting the game cascades to the copy uploads of its rows."""
        document_photo, _ = self.builder.build('game_document')
        document_file = GameDocumentFile.objects.create(
            game_document=GameDocumentFactory(game=self.game), path='files/a.pdf'
        )
        uploads = [self._upload(document_photo), self._upload(document_file)]
        regular = self._upload(document_photo, origin=Upload.ORIGIN_REGULAR)
        self.game.delete()
        assert not any(self._exists(upload) for upload in uploads)
        assert self._exists(regular)

    def test_unrelated_model_deletion_keeps_copy_uploads(self):
        """Test that deleting a non-copyable model leaves its copy uploads alone."""
        photo = GamePhoto.objects.create(game=self.game, path='photos/g.png')
        upload = self._upload(photo)
        photo.delete()
        assert self._exists(upload)
