"""Tests for the GameDocumentPageHistory model."""

import pytest

from games.models import GameDocumentPage, GameDocumentPageHistory
from games.tests.factories import GameDocumentFactory


@pytest.mark.django_db
class TestGameDocumentPageHistory:
    """Tests for the GameDocumentPageHistory model."""

    def setup_method(self):
        """Set up a game document to attach page history entries to."""
        self.document = GameDocumentFactory(name='Ancient Scroll')

    def test_game_document_page_history_creation(self):
        """Test that a game document page history entry can be created."""
        history = GameDocumentPageHistory.objects.create(
            game_document=self.document, order=1, version=1, content='Once upon a time...',
        )
        assert history.game_document == self.document
        assert history.order == 1
        assert history.version == 1
        assert history.content == 'Once upon a time...'

    def test_content_defaults_to_empty_string(self):
        """Test that content defaults to an empty string when not given."""
        history = GameDocumentPageHistory.objects.create(
            game_document=self.document, order=1, version=1,
        )
        assert history.content == ''

    def test_game_document_page_history_str(self):
        """Test string representation of a game document page history entry."""
        history = GameDocumentPageHistory(
            game_document=self.document, order=3, version=2, content='Text',
        )
        assert str(history) == f'{self.document.name} — v2 page 3'

    def test_game_document_page_history_ordering(self):
        """Test that history entries are ordered by game_document, then version, then order."""
        second_version = GameDocumentPageHistory.objects.create(
            game_document=self.document, order=1, version=2, content='Second version',
        )
        first_version = GameDocumentPageHistory.objects.create(
            game_document=self.document, order=1, version=1, content='First version',
        )
        entries = list(GameDocumentPageHistory.objects.all())
        assert entries[0].id == first_version.id
        assert entries[1].id == second_version.id

    def test_deleting_document_deletes_its_page_history(self):
        """Test that deleting a GameDocument cascades to delete its page history entries."""
        history = GameDocumentPageHistory.objects.create(
            game_document=self.document, order=1, version=1, content='Text',
        )
        self.document.delete()
        assert not GameDocumentPageHistory.objects.filter(id=history.id).exists()

    def test_survives_live_page_deletion(self):
        """Test that a history entry survives deletion of the live GameDocumentPage row."""
        page = GameDocumentPage.objects.create(
            game_document=self.document, order=1, version=1, content='Text',
        )
        history = GameDocumentPageHistory.objects.create(
            game_document=self.document, order=page.order, version=page.version,
            content=page.content,
        )
        page.delete()
        assert GameDocumentPageHistory.objects.filter(id=history.id).exists()
