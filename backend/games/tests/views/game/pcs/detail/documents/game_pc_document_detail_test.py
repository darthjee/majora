"""Tests for the PC document detail view (GET)."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterDocument
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


@pytest.mark.django_db
class TestGamePcDocumentDetailView(TokenAuthRequestMixin):
    """Tests for the GET /games/<slug>/pcs/<id>/documents/<document_id>.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)

    def _url(self, document_id, character_id=None, game_slug='test-game'):
        """Return the document detail URL for the given document (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/documents/{document_id}.json'

    def test_returns_id_game_document_id_name_photo_path_fields(self, client):
        """Test that the detail response includes the correct fields."""
        game_document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        response = client.get(self._url(character_document.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == character_document.id
        assert data['game_document_id'] == game_document.id
        assert data['name'] == 'Ancient Scroll'
        assert data['photo_path'] is None

    def test_does_not_include_description(self, client):
        """Test that description is not exposed on the public detail endpoint."""
        game_document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        response = client.get(self._url(character_document.id))
        data = json.loads(response.content)
        assert 'description' not in data

    def test_does_not_include_hidden_field(self, client):
        """Test that the hidden field is not exposed on the player-facing detail."""
        game_document = GameDocumentFactory(game=self.game, name='Scroll')
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        response = client.get(self._url(character_document.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_character_document(self, client):
        """Test that a hidden character document is not visible on the public route."""
        game_document = GameDocumentFactory(game=self.game, name='Hidden Scroll')
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document, hidden=True,
        )
        response = client.get(self._url(character_document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_document(self, client):
        """Test that 404 is returned for a non-existent document id."""
        response = client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        game_document = GameDocumentFactory(game=self.game, name='Scroll')
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        response = client.get(self._url(character_document.id, character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the character id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        game_document = GameDocumentFactory(game=self.game, name='Scroll')
        character_document = CharacterDocument.objects.create(
            character=other, game_document=game_document,
        )
        response = client.get(self._url(character_document.id, character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        game_document = GameDocumentFactory(game=self.game, name='Scroll')
        character_document = CharacterDocument.objects.create(
            character=self.character, game_document=game_document,
        )
        url = reverse(
            'game-pc-document-detail',
            kwargs={
                'game_slug': 'test-game',
                'character_id': self.character.id,
                'document_id': character_document.id,
            },
        )
        response = client.get(url)
        assert response.status_code == 200
