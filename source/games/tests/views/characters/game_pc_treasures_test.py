"""Tests for the PC treasures view."""

import json

import pytest
from django.urls import reverse

from games.models import Character, CharacterTreasure, Game, Treasure


@pytest.mark.django_db
class TestGamePcTreasuresView:
    """Tests for the GET /games/<slug>/pcs/<id>/treasures.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Aragorn', game=self.game, npc=False)

    def test_returns_empty_list_when_no_treasures(self, client):
        """Test that an empty list is returned when the PC has no treasures."""
        response = client.get(f'/games/test-game/pcs/{self.character.id}/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_name_quantity_and_value_fields(self, client):
        """Test that list items include the correct name, quantity, and value fields."""
        treasure = Treasure.objects.create(name='Potion of Healing', value=50)
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=treasure, quantity=3,
        )
        response = client.get(f'/games/test-game/pcs/{self.character.id}/treasures.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_treasure.id
        assert data[0]['name'] == 'Potion of Healing'
        assert data[0]['quantity'] == 3
        assert data[0]['value'] == 50

    def test_excludes_zero_quantity_treasures(self, client):
        """Test that a CharacterTreasure row with quantity 0 is excluded from the response."""
        treasure = Treasure.objects.create(name='Empty Pouch', value=10)
        CharacterTreasure.objects.create(character=self.character, treasure=treasure, quantity=0)
        response = client.get(f'/games/test-game/pcs/{self.character.id}/treasures.json')
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/pcs/99999/treasures.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/pcs/{self.character.id}/treasures.json')
        assert response.status_code == 404

    def test_returns_404_for_npc_id(self, client):
        """Test that 404 is returned when the id belongs to an NPC."""
        npc = Character.objects.create(name='Gandalf', game=self.game, npc=True)
        response = client.get(f'/games/test-game/pcs/{npc.id}/treasures.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(f'/games/test-game/pcs/{self.character.id}/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(f'/games/test-game/pcs/{self.character.id}/treasures.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(
            f'/games/test-game/pcs/{self.character.id}/treasures.json?per_page=5'
        )
        assert response['per_page'] == '5'

    def test_respects_page_param(self, client):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            treasure = Treasure.objects.create(name=f'Gem {i}', value=10)
            CharacterTreasure.objects.create(
                character=self.character, treasure=treasure, quantity=1,
            )
        response = client.get(
            f'/games/test-game/pcs/{self.character.id}/treasures.json?page=2&per_page=3'
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-treasures',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200
