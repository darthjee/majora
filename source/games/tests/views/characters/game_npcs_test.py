"""Tests for the game NPCs list view (visible NPCs only)."""

import json

import pytest

from games.models import Character, Game, Player


@pytest.mark.django_db
class TestGameNpcsView:

    """Tests for the game NPCs list endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.player = Player.objects.create(name='Alice')

    def test_returns_only_npcs(self, client):
        """Test that only characters with npc=True are returned."""
        Character.objects.create(name='Hero', game=self.game, player=self.player, npc=False)
        Character.objects.create(name='Villain', game=self.game)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Villain'
        assert data[0]['game_slug'] == 'test-game'

    def test_returns_empty_list_when_no_npcs(self, client):
        """Test that an empty list is returned when there are no NPCs."""
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get('/games/test-game/npcs.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get('/games/test-game/npcs.json?per_page=5')
        assert response['per_page'] == '5'

    def test_response_includes_total_header(self, client):
        """Test that the response includes the total item count header."""
        for i in range(3):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '3'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_per_page_param(self, client):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_default_page_size_uses_settings(self, client, monkeypatch):
        """Test that default per_page comes from Settings.pagination_size()."""
        monkeypatch.setenv('MAJORA_PAGINATION_SIZE', '3')
        for i in range(5):
            Character.objects.create(name=f'NPC {i}', game=self.game, npc=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['per_page'] == '3'
        data = json.loads(response.content)
        assert len(data) == 3


@pytest.mark.django_db
class TestGameNpcsHiddenFilter:

    """Tests that game_npcs excludes hidden NPCs from the public listing."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')

    def test_hidden_npc_excluded_from_listing(self, client):
        """Test that an NPC with hidden=True is not returned by the public listing."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        Character.objects.create(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['name'] == 'Visible NPC'

    def test_visible_npc_included_in_listing(self, client):
        """Test that an NPC with hidden=False is returned by the public listing."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        response = client.get('/games/test-game/npcs.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_total_header_excludes_hidden_npcs(self, client):
        """Test that the total header reflects only visible NPCs."""
        Character.objects.create(name='Visible NPC', game=self.game, npc=True, hidden=False)
        Character.objects.create(name='Hidden NPC', game=self.game, npc=True, hidden=True)
        response = client.get('/games/test-game/npcs.json')
        assert response['total'] == '1'
