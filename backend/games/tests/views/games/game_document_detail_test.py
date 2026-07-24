"""Tests for the game document detail view (GET only)."""

import json

from django.test import TestCase
from django.urls import reverse

from games.tests.factories import GameDocumentFactory, GameFactory


class TestGameDocumentDetailView(TestCase):
    """Tests for the GET /games/<slug>/documents/<document_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, document_id, game_slug='test-game'):
        """Return the document detail URL for the given document (defaults to fixture game)."""
        return f'/games/{game_slug}/documents/{document_id}.json'

    def test_returns_id_name_description_photo_path_fields(self):
        """Test that the detail response includes id, name, description, and photo_path."""
        document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        response = self.client.get(self._url(document.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == document.id
        assert data['name'] == 'Ancient Scroll'
        assert data['description'] == 'A crumbling scroll.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing detail."""
        document = GameDocumentFactory(game=self.game, name='Letter')
        response = self.client.get(self._url(document.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_document(self):
        """Test that a hidden document is not visible on the public route."""
        document = GameDocumentFactory(game=self.game, name='Secret Letter', hidden=True)
        response = self.client.get(self._url(document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_document(self):
        """Test that 404 is returned for a non-existent document id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_document_in_wrong_game(self):
        """Test that 404 is returned when the document belongs to a different game."""
        document = GameDocumentFactory(game=self.other_game, name='Treaty of Kings')
        response = self.client.get(self._url(document.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        document = GameDocumentFactory(game=self.game, name='Letter')
        response = self.client.get(self._url(document.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        document = GameDocumentFactory(game=self.game, name='Letter')
        url = reverse(
            'game-document-detail',
            kwargs={'game_slug': 'test-game', 'document_id': document.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200
