"""Tests for the CharacterDocumentSerializer."""

from django.test import TestCase

from games.models import CharacterDocument, GameDocumentPhoto
from games.serializers import CharacterDocumentSerializer
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


class TestCharacterDocumentSerializer(TestCase):
    """Tests for the CharacterDocumentSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.character = CharacterFactory(name='Frodo', game=cls.game)
        cls.game_document = GameDocumentFactory(
            game=cls.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        cls.character_document = CharacterDocument.objects.create(
            character=cls.character, game_document=cls.game_document,
        )

    def test_serializes_id(self):
        """Test that the id field is serialized as the CharacterDocument row id."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert data['id'] == self.character_document.id

    def test_serializes_game_document_id(self):
        """Test that game_document_id is sourced from the related game document's id."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert data['game_document_id'] == self.game_document.id

    def test_name_is_sourced_from_game_document_name(self):
        """Test that name is sourced directly from the game document's name."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert data['name'] == 'Ancient Scroll'

    def test_does_not_include_description(self):
        """Test that description is not exposed by the index serializer."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert 'description' not in data

    def test_photo_path_is_none_without_a_game_document_photo(self):
        """Test that photo_path is None when the game document has no photo."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert data['photo_path'] is None

    def test_photo_path_is_sourced_from_game_document_photo(self):
        """Test that photo_path is sourced directly from the game document's photo."""
        photo = GameDocumentPhoto.objects.create(
            game_document=self.game_document, path='photos/game_documents/1/photo.png',
        )
        self.game_document.photo = photo
        self.game_document.save()
        data = CharacterDocumentSerializer(self.character_document).data
        assert data['photo_path'] == 'photos/game_documents/1/photo.png'

    def test_only_exposes_expected_fields(self):
        """Test that only the documented fields are exposed."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert set(data.keys()) == {'id', 'game_document_id', 'name', 'photo_path'}

    def test_does_not_include_character(self):
        """Test that the character field is not exposed."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert 'character' not in data

    def test_does_not_include_hidden(self):
        """Test that hidden is not exposed by the player-facing serializer."""
        data = CharacterDocumentSerializer(self.character_document).data
        assert 'hidden' not in data
