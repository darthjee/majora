"""Tests for the PC documents/available.json view."""

import json

import pytest
from django.urls import reverse

from games.models import CharacterDocument
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import CharacterFactory, GameDocumentFactory, GameFactory


@pytest.mark.django_db
class TestGamePcDocumentsAvailableView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/pcs/<id>/documents/available.json."""

    def setup_method(self):
        """Set up a game, a PC, an owned document, an available document, and a hidden one."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.character = CharacterFactory(name='Aragorn', game=self.game, npc=False)
        self.owned_document = GameDocumentFactory(game=self.game, name='Owned Scroll')
        CharacterDocument.objects.create(
            character=self.character, game_document=self.owned_document,
        )
        self.available_document = GameDocumentFactory(game=self.game, name='Available Scroll')
        self.hidden_document = GameDocumentFactory(
            game=self.game, name='Hidden Scroll', hidden=True,
        )

    def _url(self, character_id=None, game_slug='test-game'):
        """Return the documents/available URL for the given character (defaults to fixture)."""
        character_id = character_id if character_id is not None else self.character.id
        return f'/games/{game_slug}/pcs/{character_id}/documents/available.json'

    def test_excludes_owned_documents(self, client):
        """Test that already-owned game documents are excluded from the catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [document['name'] for document in data]
        assert 'Owned Scroll' not in names
        assert 'Available Scroll' in names

    def test_excludes_hidden_documents(self, client):
        """Test that hidden game documents are excluded from the plain catalog."""
        response = client.get(self._url())
        data = json.loads(response.content)
        names = [document['name'] for document in data]
        assert 'Hidden Scroll' not in names

    def test_returns_id_name_photo_path_fields(self, client):
        """Test that list items include the correct fields."""
        response = client.get(self._url())
        data = json.loads(response.content)
        entry = next(document for document in data if document['name'] == 'Available Scroll')
        assert entry['id'] == self.available_document.id
        assert entry['photo_path'] is None
        assert 'hidden' not in entry

    def test_name_filter_is_case_insensitive(self, client):
        """Test that the `name` query param filters case-insensitively."""
        response = client.get(f'{self._url()}?name=available')
        data = json.loads(response.content)
        names = [document['name'] for document in data]
        assert names == ['Available Scroll']

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get(self._url(character_id=99999))
        assert response.status_code == 404

    def test_returns_404_for_opposite_role_id(self, client):
        """Test that 404 is returned when the id belongs to the opposite role."""
        other = CharacterFactory(name='Other', game=self.game, npc=True)
        response = client.get(self._url(character_id=other.id))
        assert response.status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-documents-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200
