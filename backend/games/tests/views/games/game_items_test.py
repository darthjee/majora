"""Tests for the game items view."""

import json

from django.test import TestCase
from django.urls import reverse

from games.tests.factories import GameFactory, GameItemFactory


class TestGameItemsView(TestCase):
    """Tests for the GET /games/<slug>/items.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_items(self):
        """Test that an empty list is returned when the game has no items."""
        response = self.client.get('/games/test-game/items.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_items(self):
        """Test that only items belonging to the game are returned."""
        GameItemFactory(game=self.game, name='Gold Ring')
        GameItemFactory(game=self.other_game, name='Silver Dagger')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_returns_id_name_description_photo_path_fields(self):
        """Test that list items include id, name, description, and photo_path fields."""
        item = GameItemFactory(game=self.game, name='Enchanted Bow', description='A fine bow.')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert data[0]['id'] == item.id
        assert data[0]['name'] == 'Enchanted Bow'
        assert data[0]['description'] == 'A fine bow.'
        assert data[0]['photo_path'] is None

    def test_excludes_hidden_items(self):
        """Test that a hidden game item is excluded from the response."""
        GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert data == []

    def test_includes_visible_items_alongside_hidden_ones(self):
        """Test that non-hidden items are still returned when hidden ones exist too."""
        visible = GameItemFactory(game=self.game, name='Visible Gem')
        GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == visible.id

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing list."""
        GameItemFactory(game=self.game, name='Gem')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert 'hidden' not in data[0]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self.client.get('/games/unknown-game/items.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self.client.get('/games/test-game/items.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self.client.get('/games/test-game/items.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self):
        """Test that the response includes the per_page header."""
        response = self.client.get('/games/test-game/items.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            GameItemFactory(game=self.game, name=f'Item {i}')
        response = self.client.get('/games/test-game/items.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-items', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url)
        assert response.status_code == 200

    def test_returns_items_ordered_by_id(self):
        """Test that items are returned ordered by id."""
        first = GameItemFactory(game=self.game, name='First Item')
        second = GameItemFactory(game=self.game, name='Second Item')
        response = self.client.get('/games/test-game/items.json')
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]
