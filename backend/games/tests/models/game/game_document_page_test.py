"""Tests for the GameDocumentPage model."""

import pytest

from games.models import GameDocumentPage
from games.tests.factories import GameDocumentFactory


@pytest.mark.django_db
class TestGameDocumentPage:
    """Tests for the GameDocumentPage model."""

    def setup_method(self):
        """Set up a game document to attach pages to."""
        self.document = GameDocumentFactory(name='Ancient Scroll')

    def test_game_document_page_creation(self):
        """Test that a game document page can be created."""
        page = GameDocumentPage.objects.create(
            game_document=self.document, content='Once upon a time...', order=1,
        )
        assert page.game_document == self.document
        assert page.content == 'Once upon a time...'
        assert page.order == 1

    def test_content_defaults_to_empty_string(self):
        """Test that content defaults to an empty string when not given."""
        page = GameDocumentPage.objects.create(game_document=self.document, order=1)
        assert page.content == ''

    def test_version_defaults_to_one(self):
        """Test that version defaults to 1 when not given."""
        page = GameDocumentPage.objects.create(game_document=self.document, order=1)
        assert page.version == 1

    def test_version_can_be_set_explicitly(self):
        """Test that version can be set to a value other than the default."""
        page = GameDocumentPage.objects.create(
            game_document=self.document, order=1, version=3,
        )
        assert page.version == 3

    def test_game_document_page_str(self):
        """Test string representation of a game document page."""
        page = GameDocumentPage(game_document=self.document, content='Text', order=3)
        assert str(page) == f'{self.document.name} — page 3'

    def test_game_document_page_ordering(self):
        """Test that pages are ordered by game_document then order."""
        second = GameDocumentPage.objects.create(
            game_document=self.document, content='Second', order=2,
        )
        first = GameDocumentPage.objects.create(
            game_document=self.document, content='First', order=1,
        )
        pages = list(GameDocumentPage.objects.all())
        assert pages[0].id == first.id
        assert pages[1].id == second.id

    def test_deleting_document_deletes_its_pages(self):
        """Test that deleting a GameDocument cascades to delete its pages."""
        page = GameDocumentPage.objects.create(
            game_document=self.document, content='Text', order=1,
        )
        self.document.delete()
        assert not GameDocumentPage.objects.filter(id=page.id).exists()
