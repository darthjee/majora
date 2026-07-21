"""Tests for the CharacterDocumentPhoto model."""

from django.test import TestCase

from games.models import CharacterDocumentPhoto
from games.tests.factories import CharacterDocumentFactory


class TestCharacterDocumentPhoto(TestCase):
    """Tests for the CharacterDocumentPhoto model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.character_document = CharacterDocumentFactory()

    def test_character_document_photo_creation(self):
        """Test that a character document photo can be created and linked to its document."""
        photo = CharacterDocumentPhoto.objects.create(
            path='photos/character_documents/1/photo.png',
            character_document=self.character_document,
        )
        assert photo.path == 'photos/character_documents/1/photo.png'
        assert photo.character_document == self.character_document

    def test_character_document_photo_str(self):
        """Test string representation of a character document photo."""
        photo = CharacterDocumentPhoto(
            path='photos/character_documents/1/photo.jpg',
            character_document=self.character_document,
        )
        assert str(photo) == 'photos/character_documents/1/photo.jpg'

    def test_character_document_photos_related_name(self):
        """Test that photos can be accessed via the character document's related name."""
        CharacterDocumentPhoto.objects.create(
            path='photos/character_documents/1/photo1.png',
            character_document=self.character_document,
        )
        CharacterDocumentPhoto.objects.create(
            path='photos/character_documents/1/photo2.png',
            character_document=self.character_document,
        )
        assert self.character_document.photos.count() == 2

    def test_deleting_photo_clears_character_document_photo(self):
        """Test that deleting a photo sets CharacterDocument.photo back to None."""
        photo = CharacterDocumentPhoto.objects.create(
            path='photos/character_documents/1/photo.png',
            character_document=self.character_document,
        )
        self.character_document.photo = photo
        self.character_document.save()

        photo.delete()

        self.character_document.refresh_from_db()
        assert self.character_document.photo is None
