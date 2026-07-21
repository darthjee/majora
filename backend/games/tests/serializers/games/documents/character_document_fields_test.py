"""Tests for the character_document_fields fallback resolution helpers."""

from django.test import TestCase

from games.models import CharacterDocumentPhoto, GameDocumentPhoto
from games.serializers.games.documents.character_document_fields import (
    resolve_character_document_field,
    resolve_character_document_photo_path,
)
from games.tests.factories import CharacterDocumentFactory, GameDocumentFactory


class TestResolveCharacterDocumentField(TestCase):
    """Tests for resolve_character_document_field."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game_document = GameDocumentFactory(name='Ancient Scroll', description='Crumbling.')
        cls.character_document = CharacterDocumentFactory(game_document=cls.game_document)

    def test_returns_own_value_when_set(self):
        """Test that the character document's own field value is returned when not None."""
        self.character_document.name = "Frodo's Scroll"
        self.character_document.save()
        assert (
            resolve_character_document_field(self.character_document, 'name')
            == "Frodo's Scroll"
        )

    def test_falls_back_to_game_document_value_when_none(self):
        """Test that the game document's field value is returned when the override is None."""
        assert (
            resolve_character_document_field(self.character_document, 'name')
            == 'Ancient Scroll'
        )

    def test_falls_back_for_description(self):
        """Test that description falls back to the game document's description when None."""
        assert (
            resolve_character_document_field(self.character_document, 'description')
            == 'Crumbling.'
        )


class TestResolveCharacterDocumentPhotoPath(TestCase):
    """Tests for resolve_character_document_photo_path."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game_document = GameDocumentFactory(name='Ancient Scroll')
        cls.character_document = CharacterDocumentFactory(game_document=cls.game_document)

    def test_returns_none_when_neither_has_a_photo(self):
        """Test that None is returned when neither the character nor game document has one."""
        assert resolve_character_document_photo_path(self.character_document) is None

    def test_falls_back_to_game_document_photo(self):
        """Test that the game document's photo path is used when the character has none."""
        photo = GameDocumentPhoto.objects.create(
            game_document=self.game_document, path='photos/game_documents/1/photo.png',
        )
        self.game_document.photo = photo
        self.game_document.save()
        assert (
            resolve_character_document_photo_path(self.character_document)
            == 'photos/game_documents/1/photo.png'
        )

    def test_prefers_own_photo_over_game_document_photo(self):
        """Test that the character document's own photo path takes precedence."""
        game_photo = GameDocumentPhoto.objects.create(
            game_document=self.game_document, path='photos/game_documents/1/photo.png',
        )
        self.game_document.photo = game_photo
        self.game_document.save()
        own_photo = CharacterDocumentPhoto.objects.create(
            character_document=self.character_document,
            path='photos/character_documents/1/photo.png',
        )
        self.character_document.photo = own_photo
        self.character_document.save()
        assert (
            resolve_character_document_photo_path(self.character_document)
            == 'photos/character_documents/1/photo.png'
        )
