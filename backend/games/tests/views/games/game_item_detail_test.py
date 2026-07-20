"""Tests for the game item detail view."""

import json

from django.test import TestCase
from django.urls import reverse

from games.tests.factories import GameFactory, GameItemFactory


class TestGameItemDetailView(TestCase):
    """Tests for the GET /games/<slug>/items/<item_id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')

    def _url(self, item_id, game_slug='test-game'):
        """Return the item detail URL for the given item (defaults to the fixture game)."""
        return f'/games/{game_slug}/items/{item_id}.json'

    def test_returns_id_name_description_photo_path_fields(self):
        """Test that the detail response includes id, name, description, and photo_path."""
        item = GameItemFactory(game=self.game, name='Enchanted Bow', description='A fine bow.')
        response = self.client.get(self._url(item.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == item.id
        assert data['name'] == 'Enchanted Bow'
        assert data['description'] == 'A fine bow.'
        assert data['photo_path'] is None

    def test_does_not_include_hidden_field(self):
        """Test that the hidden field is not exposed on the player-facing detail."""
        item = GameItemFactory(game=self.game, name='Gem')
        response = self.client.get(self._url(item.id))
        data = json.loads(response.content)
        assert 'hidden' not in data

    def test_returns_404_for_hidden_item(self):
        """Test that a hidden item is not visible on the public route."""
        item = GameItemFactory(game=self.game, name='Hidden Gem', hidden=True)
        response = self.client.get(self._url(item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_item(self):
        """Test that 404 is returned for a non-existent item id."""
        response = self.client.get(self._url(99999))
        assert response.status_code == 404

    def test_returns_404_for_item_in_wrong_game(self):
        """Test that 404 is returned when the item belongs to a different game."""
        item = GameItemFactory(game=self.other_game, name='Silver Dagger')
        response = self.client.get(self._url(item.id))
        assert response.status_code == 404

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        item = GameItemFactory(game=self.game, name='Gem')
        response = self.client.get(self._url(item.id, game_slug='unknown-game'))
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        item = GameItemFactory(game=self.game, name='Gem')
        url = reverse(
            'game-item-detail', kwargs={'game_slug': 'test-game', 'item_id': item.id},
        )
        response = self.client.get(url)
        assert response.status_code == 200
