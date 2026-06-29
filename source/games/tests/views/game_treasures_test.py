"""Tests for the game treasures view."""

import json

import pytest
from django.urls import reverse

from games.models import Game, Treasure


@pytest.mark.django_db
class TestGameTreasuresView:
    """Tests for the GET /games/<slug>/treasures.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.other_game = Game.objects.create(name='Other Game', game_slug='other-game')

    def test_returns_empty_list_when_no_treasures(self, client):
        """Test that an empty list is returned when the game has no treasures."""
        response = client.get('/games/test-game/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_only_game_treasures(self, client):
        """Test that only treasures linked to the game are returned."""
        treasure = Treasure.objects.create(name='Gold Ring', value=100)
        other_treasure = Treasure.objects.create(name='Silver Dagger', value=50)
        self.game.treasures.add(treasure)
        self.other_game.treasures.add(other_treasure)
        response = client.get('/games/test-game/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Gold Ring'

    def test_returns_id_name_value_fields(self, client):
        """Test that list items include id, name, and value fields."""
        treasure = Treasure.objects.create(name='Enchanted Bow', value=750)
        self.game.treasures.add(treasure)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data[0]['id'] == treasure.id
        assert data[0]['name'] == 'Enchanted Bow'
        assert data[0]['value'] == 750

    def test_returns_404_for_unknown_game_slug(self, client):
        """Test that 404 is returned for a non-existent game slug."""
        response = client.get('/games/unknown-game/treasures.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/treasures.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/treasures.json?per_page=5')
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            treasure = Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
            self.game.treasures.add(treasure)
        response = client.get('/games/test-game/treasures.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            treasure = Treasure.objects.create(name=f'Treasure {i}', value=i * 10)
            self.game.treasures.add(treasure)
        response = client.get('/games/test-game/treasures.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-treasures', kwargs={'game_slug': 'test-game'})
        response = client.get(url)
        assert response.status_code == 200

    def test_does_not_return_unlinked_treasures(self, client):
        """Test that treasures not linked to the game are excluded."""
        Treasure.objects.create(name='Orphan Treasure', value=300)
        response = client.get('/games/test-game/treasures.json')
        data = json.loads(response.content)
        assert data == []
