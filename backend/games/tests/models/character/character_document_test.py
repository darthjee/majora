"""Tests for the CharacterDocument model."""

import pytest
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import CharacterDocument
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


class TestCharacterDocument(TestCase):
    """Tests for the CharacterDocument model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_document = GameDocumentFactory(game=cls.game, name='Ancient Scroll')

    def test_character_document_creation(self):
        """Test that a character document can be created linking a character and a document."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        assert character_document.character == self.character
        assert character_document.game_document == self.game_document

    def test_name_defaults_to_none(self):
        """Test that name defaults to None (falls back to the game document's name)."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        assert character_document.name is None

    def test_description_defaults_to_none(self):
        """Test that description defaults to None (falls back to the game document's)."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        assert character_document.description is None

    def test_hidden_defaults_to_false(self):
        """Test that a character document is not hidden by default."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        assert character_document.hidden is False

    def test_character_document_can_be_hidden(self):
        """Test that a character document can be created as hidden."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document, hidden=True,
        )
        assert character_document.hidden is True

    def test_character_document_can_override_name_and_description(self):
        """Test that a character document's own name/description override the game document's."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
            name='Frodo\'s Scroll', description='Slightly torn at the edges.',
        )
        assert character_document.name == 'Frodo\'s Scroll'
        assert character_document.description == 'Slightly torn at the edges.'

    def test_character_document_str_falls_back_to_game_document_name(self):
        """Test that str() falls back to the game document's name when no override is set."""
        character_document = CharacterDocument(
            character=self.character, game_document=self.game_document,
        )
        assert str(character_document) == 'Ancient Scroll'

    def test_character_document_str_uses_own_name_when_set(self):
        """Test that str() uses the character document's own name when overridden."""
        character_document = CharacterDocument(
            character=self.character, game_document=self.game_document, name='Frodo\'s Scroll',
        )
        assert str(character_document) == 'Frodo\'s Scroll'

    def test_character_documents_related_name(self):
        """Test that character documents can be accessed via the character's related name."""
        CharacterDocument.objects.create(character=self.character, game_document=self.game_document)
        other_document = GameDocumentFactory(game=self.game, name='Treaty of Kings')
        CharacterDocument.objects.create(character=self.character, game_document=other_document)
        assert self.character.character_documents.count() == 2

    def test_game_document_character_documents_related_name(self):
        """Test that character documents can be accessed via the game document's related name."""
        CharacterDocument.objects.create(character=self.character, game_document=self.game_document)
        assert self.game_document.character_documents.count() == 1

    def test_character_document_ordering(self):
        """Test that character documents are ordered by id."""
        first = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        other_document = GameDocumentFactory(game=self.game, name='Treaty of Kings')
        second = CharacterDocument.objects.create(
            character=self.character, game_document=other_document,
        )
        character_documents = list(CharacterDocument.objects.all())
        assert character_documents[0].id == first.id
        assert character_documents[1].id == second.id

    def test_deleting_character_cascades_to_character_document(self):
        """Test that deleting a character deletes its character documents."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        self.character.delete()
        assert not CharacterDocument.objects.filter(id=character_document.id).exists()

    def test_deleting_game_document_cascades_to_character_document(self):
        """Test that deleting a game document deletes the linking character document."""
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )
        self.game_document.delete()
        assert not CharacterDocument.objects.filter(id=character_document.id).exists()

    def test_duplicate_character_document_raises_integrity_error(self):
        """Test that a second row for the same character/game_document pair is rejected."""
        CharacterDocument.objects.create(character=self.character, game_document=self.game_document)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                CharacterDocument.objects.create(
                    character=self.character, game_document=self.game_document,
                )
