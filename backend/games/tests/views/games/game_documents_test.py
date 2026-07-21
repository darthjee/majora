"""Tests for the game documents view."""

import json

from django.test import TestCase
from django.urls import reverse

from games.tests.factories import GameDocumentFactory, GameFactory


class TestGameDocumentsView(TestCase):
    """Tests for the GET /games/<slug>/documents.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_documents(self):
        """Test that an empty list is returned when the game has no documents."""
        response = self.client.get('/games/test-game/documents.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_documents(self):
        """Test that only documents belonging to the game are returned."""
        GameDocumentFactory(game=self.game, name='Ancient Scroll')
        GameDocumentFactory(game=self.other_game, name='Treaty of Kings')
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Ancient Scroll'

    def test_returns_id_name_photo_path_fields(self):
        """Test that list documents include id, name, and photo_path fields."""
        document = GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert data[0]['id'] == document.id
        assert data[0]['name'] == 'Ancient Scroll'
        assert data[0]['photo_path'] is None

    def test_does_not_include_description(self):
        """Test that description is not exposed on the index endpoint."""
        GameDocumentFactory(
            game=self.game, name='Ancient Scroll', description='A crumbling scroll.',
        )
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert 'description' not in data[0]

    def test_excludes_hidden_documents(self):
        """Test that a hidden game document is excluded from the response."""
        GameDocumentFactory(game=self.game, name='Secret Letter', hidden=True)
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert data == []

    def test_includes_visible_documents_alongside_hidden_ones(self):
        """Test that non-hidden documents are still returned when hidden ones exist too."""
        visible = GameDocumentFactory(game=self.game, name='Visible Letter')
        GameDocumentFactory(game=self.game, name='Secret Letter', hidden=True)
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == visible.id

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing list."""
        GameDocumentFactory(game=self.game, name='Letter')
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/documents.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/documents.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/documents.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/documents.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameDocumentFactory(game=self.game, name=f'Document {i}')
        response = self.client.get('/games/test-game/documents.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-documents', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200

    def test_returns_documents_ordered_by_id(self):
        """Test that documents are returned ordered by id."""
        first = GameDocumentFactory(game=self.game, name='First Document')
        second = GameDocumentFactory(game=self.game, name='Second Document')
        response = self.client.get('/games/test-game/documents.json')
        data = json.loads(response.content)
        assert [document['id'] for document in data] == [first.id, second.id]
