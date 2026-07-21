"""Tests for the PC documents view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterDocument
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


@pytest.mark.django_db
class TestGamePcDocumentsView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/documents.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the documents list URL for the given character (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/documents.json'

    def test_returns_empty_list_when_no_documents(self, client):
        """Test that an empty list is returned when the character has no documents."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_id_game_document_id_name_photo_path_fields(self, client):
        """Test that list documents include the correct fields."""
        game_document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_document.id
        assert data[0]['game_document_id'] == game_document.id
        assert data[0]['name'] == 'Ancient Scroll'
        assert data[0]['photo_path'] is None

    def test_does_not_include_description(self, client):
        """Test that description is not exposed on the index endpoint."""
        game_document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        CharacterDocument.objects.create(character=self.character, game_document=game_document)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'description' not in data[0]

    def test_name_override_takes_precedence(self, client):
        """Test that a character document's own name override is used over the game document's."""
        game_document = GameDocumentFactory(game=self.game, name='Ancient Scroll')
        CharacterDocument.objects.create(
            character=self.character, game_document=game_document, name="Aragorn's Scroll",
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert data[0]['name'] == "Aragorn's Scroll"

    def test_excludes_hidden_documents(self, client):
        """Test that a hidden character document is excluded from the response."""
        game_document = GameDocumentFactory(game=self.game, name='Secret Scroll')
        CharacterDocument.objects.create(
            character=self.character, game_document=game_document, hidden=True,
        )
        response = client.get(self._url())
        assert json.loads(response.content) == []

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing list."""
        game_document = GameDocumentFactory(game=self.game, name='Scroll')
        CharacterDocument.objects.create(character=self.character, game_document=game_document)
        response = client.get(self._url())
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        GameFactory(name='Other Game', game_slug='other-game')
        response = client.get(self._url(game_slug='other-game'))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-documents',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_returns_documents_ordered_by_id(self, client):
        """Test that documents are returned ordered by id."""
        first_game_document = GameDocumentFactory(game=self.game, name='First Scroll')
        second_game_document = GameDocumentFactory(game=self.game, name='Second Scroll')
        first = CharacterDocument.objects.create(
            character=self.character, game_document=first_game_document,
        )
        second = CharacterDocument.objects.create(
            character=self.character, game_document=second_game_document,
        )
        response = client.get(self._url())
        data = json.loads(response.content)
        assert [document['id'] for document in data] == [first.id, second.id]
