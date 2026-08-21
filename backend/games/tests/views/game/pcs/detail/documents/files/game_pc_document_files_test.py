"""Tests for the PC document files-list view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterDocument, GameDocumentFile
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


@pytest.mark.django_db
class TestGamePcDocumentFilesView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/documents/<document_id>/files.json."""

    def setup_method(self):
        """Set up a game, a PC, a game document, and a held CharacterDocument."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.game_document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        self.character_document = CharacterDocument.objects.create(
            character=self.character, game_document=self.game_document,
        )

    def _url(self, document_id=None, character_id=None, game_slug='test-game'):
        """Return the files list URL for the given document (defaults to the fixture)."""
        document_id = document_id if document_id is not None else self.character_document.id
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/documents/{document_id}/files.json'

    def test_returns_empty_list_when_no_files(self, client):
        """Test that an empty list is returned when the document has no files."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_ready_files_with_character_document_id(self, client):
        """Test that list items include the character_document_id and mirror the game file."""
        file = GameDocumentFile.objects.create(
            path='files/games/test-game/documents/1/scroll.pdf',
            name='Scroll',
            game_document=self.game_document,
            ready=True,
        )
        GameDocumentFile.objects.create(
            path='files/games/test-game/documents/1/draft.pdf',
            name='Draft',
            game_document=self.game_document,
            ready=False,
        )
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == file.id
        assert data[0]['character_document_id'] == self.character_document.id
        assert data[0]['name'] == file.name
        assert data[0]['path'] == file.path
        assert data[0]['photo_path'] is None

    def test_visible_even_when_game_document_is_hidden(self, client):
        """Test that a held document's files stay visible even if the GameDocument is hidden."""
        self.game_document.hidden = True
        self.game_document.save()
        GameDocumentFile.objects.create(
            path='files/games/test-game/documents/1/scroll.pdf',
            name='Scroll',
            game_document=self.game_document,
            ready=True,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1

    def test_returns_404_for_hidden_character_document(self, client):
        """Test that a hidden CharacterDocument's files are not visible on the public route."""
        hidden_document = CharacterDocument.objects.create(
            character=self.character, game_document=GameDocumentFactory(game=self.game),
            hidden=True,
        )
        response = client.get(self._url(document_id=hidden_document.id))
        assert response.status_code == 404

    def test_returns_empty_list_for_incognito_character(self, client):
        """Test that an incognito character's files list resolves to an empty list."""
        self.character.incognito = True
        self.character.save()
        GameDocumentFile.objects.create(
            path='files/games/test-game/documents/1/scroll.pdf',
            name='Scroll',
            game_document=self.game_document,
            ready=True,
        )
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a non-existent document id."""
        response = client.get(self._url(document_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameDocumentFile.objects.create(
                path=f'files/games/test-game/documents/1/file-{i}.pdf',
                name=f'File {i}',
                game_document=self.game_document,
                ready=True,
            )
        response = client.get(f'{self._url()}?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-document-files',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'document_id': self.character_document.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200
