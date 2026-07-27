"""Tests for the GameDocumentFilePhoto model and GameDocumentFile.photo relation."""

from django.test import TestCase

from games.models import GameDocumentFile, GameDocumentFilePhoto
from games.tests.factories import GameDocumentFactory


class TestGameDocumentFilePhoto(TestCase):
    """Tests for the GameDocumentFilePhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.document = GameDocumentFactory(name='Ancient Scroll')

    def test_game_document_file_photo_creation(self):
        """Test that a game document file photo can be created."""
        photo = GameDocumentFilePhoto.objects.create(
            path='photos/game_document_files/1/photo.png',
        )
        assert photo.path == 'photos/game_document_files/1/photo.png'

    def test_game_document_file_photo_str(self):
        """Test string representation of a game document file photo."""
        photo = GameDocumentFilePhoto(path='photos/game_document_files/1/photo.jpg')
        assert str(photo) == 'photos/game_document_files/1/photo.jpg'


class TestGameDocumentFilePhotoRelation(TestCase):
    """Tests for the GameDocumentFile.photo relation."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.document = GameDocumentFactory(name='Ancient Scroll')

    def test_game_document_file_created_without_photo(self):
        """Test that a game document file can be created without a photo."""
        document_file = GameDocumentFile.objects.create(
            game_document=self.document, path='files/scroll.pdf', name='scroll.pdf',
        )
        assert document_file.photo is None

    def test_game_document_file_created_with_photo(self):
        """Test that a game document file can be created linked to a photo."""
        photo = GameDocumentFilePhoto.objects.create(path='photos/thumb.png')
        document_file = GameDocumentFile.objects.create(
            game_document=self.document, path='files/scroll.pdf', name='scroll.pdf', photo=photo,
        )
        assert document_file.photo == photo

    def test_deleting_photo_clears_game_document_file_photo(self):
        """Test that deleting a file's photo sets GameDocumentFile.photo back to None."""
        photo = GameDocumentFilePhoto.objects.create(path='photos/thumb.png')
        document_file = GameDocumentFile.objects.create(
            game_document=self.document, path='files/scroll.pdf', name='scroll.pdf', photo=photo,
        )

        photo.delete()

        document_file.refresh_from_db()
        assert document_file.photo is None
