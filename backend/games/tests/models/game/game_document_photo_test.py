"""Tests for the GameDocumentPhoto model."""

from django.test import TestCase

from games.models import GameDocumentPhoto
from games.tests.factories import GameDocumentFactory


class TestGameDocumentPhoto(TestCase):
    """Tests for the GameDocumentPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.document = GameDocumentFactory(name='Ancient Scroll')

    def test_game_document_photo_creation(self):
        """Test that a game document photo can be created and linked to a game document."""
        photo = GameDocumentPhoto.objects.create(
            path='photos/game_documents/1/photo.png', game_document=self.document,
        )
        assert photo.path == 'photos/game_documents/1/photo.png'
        assert photo.game_document == self.document

    def test_game_document_photo_str(self):
        """Test string representation of a game document photo."""
        photo = GameDocumentPhoto(
            path='photos/game_documents/1/photo.jpg', game_document=self.document,
        )
        assert str(photo) == 'photos/game_documents/1/photo.jpg'

    def test_game_document_photos_related_name(self):
        """Test that photos can be accessed via the game document's related name."""
        GameDocumentPhoto.objects.create(
            path='photos/game_documents/1/photo1.png', game_document=self.document,
        )
        GameDocumentPhoto.objects.create(
            path='photos/game_documents/1/photo2.png', game_document=self.document,
        )
        assert self.document.photos.count() == 2

    def test_deleting_photo_clears_game_document_photo(self):
        """Test that deleting a game document's photo sets GameDocument.photo back to None."""
        photo = GameDocumentPhoto.objects.create(
            path='photos/game_documents/1/photo.png', game_document=self.document,
        )
        self.document.photo = photo
        self.document.save()

        photo.delete()

        self.document.refresh_from_db()
        assert self.document.photo is None
