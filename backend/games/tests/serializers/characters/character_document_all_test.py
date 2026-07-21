"""Tests for the CharacterDocumentAllSerializer."""

from django.test import TestCase

from games.models import CharacterDocument
from games.serializers import CharacterDocumentAllSerializer
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


class TestCharacterDocumentAllSerializer(TestCase):
    """Tests for the CharacterDocumentAllSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game, npc=True)
        cls.game_document = GameDocumentFactory(game=cls.game, name='Ancient Scroll')
        cls.character_document = CharacterDocument.objects.create(
            character=cls.character, game_document=cls.game_document,
        )

    def test_includes_hidden_field_alongside_character_document_fields(self):
        """Test that the serializer exposes every CharacterDocumentSerializer field plus hidden."""
        data = CharacterDocumentAllSerializer(self.character_document).data
        assert set(data.keys()) == {
            'id', 'game_document_id', 'name', 'photo_path', 'hidden',
        }

    def test_hidden_reflects_the_character_document_own_field(self):
        """Test that hidden reflects the character document's own hidden field."""
        self.character_document.hidden = True
        self.character_document.save()
        data = CharacterDocumentAllSerializer(self.character_document).data
        assert data['hidden'] is True

    def test_hidden_defaults_to_false(self):
        """Test that hidden defaults to False when not set."""
        data = CharacterDocumentAllSerializer(self.character_document).data
        assert data['hidden'] is False
