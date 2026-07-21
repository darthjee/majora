"""Tests for the GameDocument model."""

from django.test import TestCase

from games.models import GameDocument
from games.tests.factories import GameFactory


class TestGameDocument(TestCase):
    """Tests for the GameDocument model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_game_document_creation(self):
        """Test that a game document can be created linked to a game."""
        document = GameDocument.objects.create(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        assert document.game == self.game
        assert document.name == 'Ancient Scroll'
        assert document.description == 'A crumbling scroll.'

    def test_hidden_defaults_to_false(self):
        """Test that a game document is not hidden by default."""
        document = GameDocument.objects.create(game=self.game, name='Letter')
        assert document.hidden is False

    def test_game_document_can_be_hidden(self):
        """Test that a game document can be created as hidden."""
        document = GameDocument.objects.create(game=self.game, name='Secret Letter', hidden=True)
        assert document.hidden is True

    def test_description_defaults_to_empty_string(self):
        """Test that description defaults to an empty string when not specified."""
        document = GameDocument.objects.create(game=self.game, name='Plain Letter')
        assert document.description == ''

    def test_game_document_str(self):
        """Test string representation of a game document."""
        document = GameDocument(game=self.game, name='Treaty of Kings')
        assert str(document) == 'Treaty of Kings'

    def test_game_documents_related_name(self):
        """Test that game documents can be accessed via the game's related name."""
        GameDocument.objects.create(game=self.game, name='Document One')
        GameDocument.objects.create(game=self.game, name='Document Two')
        assert self.game.documents.count() == 2

    def test_game_document_ordering(self):
        """Test that game documents are ordered by id."""
        first = GameDocument.objects.create(game=self.game, name='First Document')
        second = GameDocument.objects.create(game=self.game, name='Second Document')
        documents = list(GameDocument.objects.all())
        assert documents[0].id == first.id
        assert documents[1].id == second.id

    def test_deleting_game_cascades_to_game_document(self):
        """Test that deleting a game deletes its game documents."""
        document = GameDocument.objects.create(game=self.game, name='Doomed Document')
        self.game.delete()
        assert not GameDocument.objects.filter(id=document.id).exists()
