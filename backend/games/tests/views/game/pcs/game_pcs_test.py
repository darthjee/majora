"""Tests for the game PC list view."""

import json

import pytest

from games.tests.factories import CharacterFactory, GameFactory, PlayerFactory


@pytest.mark.django_db
class TestGamePcsView:
    """Tests for the game PCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.player = PlayerFactory(name='Alice')

    def _url(self, query=''):
        """Return the list URL for the fixture game, optionally with a query string."""
        return f'/games/test-game/pcs.json{query}'

    def test_returns_only_matching_role(self, client):
        """Test that only PCs are returned."""
        CharacterFactory(name='Hero', game=self.game, player=self.player, npc=False)
        CharacterFactory(name='Villain', game=self.game, npc=True)
        response = client.get(self._url())
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Hero'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_none(self, client):
        """Test that an empty list is returned when there are no matching characters."""
        response = client.get(self._url())
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(self._url())
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(self._url())
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(self._url('?per_page=5'))
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            CharacterFactory(name=f'Character {i}', game=self.game, player=self.player, npc=False)
        response = client.get(self._url('?page=2&per_page=3'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            CharacterFactory(name=f'Character {i}', game=self.game, player=self.player, npc=False)
        response = client.get(self._url('?per_page=2'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_returns_404_for_unknown_game(self, client):
        """Test that 404 is returned for a non-existent game_slug."""
        response = client.get('/games/unknown-game/pcs.json')
        assert response.status_code == 404
