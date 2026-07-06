"""Tests for the NPC treasures view."""

import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Character, CharacterTreasure, Game, GameMaster, Treasure


@pytest.mark.django_db
class TestGameNpcTreasuresView:
    """Tests for the GET /games/<slug>/npcs/<id>/treasures.json endpoint."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.character = Character.objects.create(name='Gandalf', game=self.game, npc=True)

    def test_returns_empty_list_when_no_treasures(self, client):
        """Test that an empty list is returned when the NPC has no treasures."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/treasures.json')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_name_quantity_and_value_fields(self, client):
        """Test that list items include the correct name, quantity, and value fields."""
        treasure = Treasure.objects.create(name='Staff of Power', value=1000)
        character_treasure = CharacterTreasure.objects.create(
            character=self.character, treasure=treasure, quantity=1,
        )
        response = client.get(f'/games/test-game/npcs/{self.character.id}/treasures.json')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == character_treasure.id
        assert data[0]['name'] == 'Staff of Power'
        assert data[0]['quantity'] == 1
        assert data[0]['value'] == 1000

    def test_excludes_zero_quantity_treasures(self, client):
        """Test that a CharacterTreasure row with quantity 0 is excluded from the response."""
        treasure = Treasure.objects.create(name='Empty Pouch', value=10)
        CharacterTreasure.objects.create(character=self.character, treasure=treasure, quantity=0)
        response = client.get(f'/games/test-game/npcs/{self.character.id}/treasures.json')
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_character(self, client):
        """Test that 404 is returned for a non-existent character_id."""
        response = client.get('/games/test-game/npcs/99999/treasures.json')
        assert response.status_code == 404

    def test_returns_404_for_character_in_wrong_game(self, client):
        """Test that 404 is returned when the character belongs to a different game."""
        Game.objects.create(name='Other Game', game_slug='other-game')
        response = client.get(f'/games/other-game/npcs/{self.character.id}/treasures.json')
        assert response.status_code == 404

    def test_returns_404_for_pc_id(self, client):
        """Test that 404 is returned when the id belongs to a PC."""
        pc = Character.objects.create(name='Aragorn', game=self.game, npc=False)
        response = client.get(f'/games/test-game/npcs/{pc.id}/treasures.json')
        assert response.status_code == 404

    def test_response_includes_page_header(self, client):
        """Test that the response includes the page header."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/treasures.json')
        assert response['page'] == '1'

    def test_response_includes_pages_header(self, client):
        """Test that the response includes the total pages header."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/treasures.json')
        assert response['pages'] == '1'

    def test_response_includes_per_page_header(self, client):
        """Test that the response includes the per_page header."""
        response = client.get(
            f'/games/test-game/npcs/{self.character.id}/treasures.json?per_page=5'
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
            f'/games/test-game/npcs/{self.character.id}/treasures.json?page=2&per_page=3'
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-treasures',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        response = client.get(url)
        assert response.status_code == 200

    def test_response_includes_x_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = client.get(f'/games/test-game/npcs/{self.character.id}/treasures.json')
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestGameNpcTreasuresHidden:
    """Tests for the hidden-NPC visibility gate in game_npc_treasures."""

    def setup_method(self):
        """Set up common test fixtures."""
        self.game = Game.objects.create(name='Test Game', game_slug='test-game')
        self.dm_user = User.objects.create_user(username='dm_user', password='secret-password')
        GameMaster.objects.create(game=self.game, user=self.dm_user)
        self.hidden_npc = Character.objects.create(
            name='Secret NPC', game=self.game, npc=True, hidden=True
        )
        treasure = Treasure.objects.create(name='Hidden Gem', value=999)
        CharacterTreasure.objects.create(
            character=self.hidden_npc, treasure=treasure, quantity=1,
        )

    def test_hidden_npc_treasures_returns_404_for_anonymous(self, client):
        """Test that an anonymous request to a hidden NPC's treasures gets 404."""
        response = client.get(f'/games/test-game/npcs/{self.hidden_npc.id}/treasures.json')
        assert response.status_code == 404

    def test_hidden_npc_treasures_returns_404_for_regular_user(self, client):
        """Test that a non-DM authenticated user gets 404 for a hidden NPC's treasures."""
        other_user = User.objects.create_user(username='other', password='secret-password')
        token = Token.objects.create(user=other_user)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 404

    def test_hidden_npc_treasures_returns_200_for_dm(self, client):
        """Test that a DM can access a hidden NPC's treasures."""
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_treasures_returns_200_for_superuser(self, client):
        """Test that a superuser can access a hidden NPC's treasures."""
        superuser = User.objects.create_superuser(username='admin', password='secret-password')
        token = Token.objects.create(user=superuser)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_visible_npc_treasures_returns_200_for_anonymous(self, client):
        """Test that a visible NPC's treasures are still accessible to anonymous users."""
        visible_npc = Character.objects.create(
            name='Visible NPC', game=self.game, npc=True, hidden=False
        )
        treasure = Treasure.objects.create(name='Public Gem', value=1)
        CharacterTreasure.objects.create(
            character=visible_npc, treasure=treasure, quantity=1,
        )
        response = client.get(f'/games/test-game/npcs/{visible_npc.id}/treasures.json')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1

    def test_hidden_npc_treasures_response_includes_x_skip_cache_header_for_dm(self, client):
        """Test that a DM's response for a hidden NPC's treasures includes X-Skip-Cache: true."""
        token = Token.objects.create(user=self.dm_user)
        response = client.get(
            f'/games/test-game/npcs/{self.hidden_npc.id}/treasures.json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response['X-Skip-Cache'] == 'true'
