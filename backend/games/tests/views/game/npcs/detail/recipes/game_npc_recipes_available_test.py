"""Tests for the NPC recipes/available.json view (regular.create; issue #1459)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_exchange_fixtures import (
    CharacterRecipeExchangeFixtures,
)


@pytest.mark.django_db
class TestGameNpcRecipesAvailableView(CharacterRecipeExchangeFixtures):
    """Tests for GET /games/<slug>/npcs/<id>/recipes/available.json."""

    kind = 'npc'

    def setup_method(self):
        """Set up an NPC with known rows, a catalog and another game's recipes."""
        self.setup_exchange()

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self.url('available.json')).status_code == 401

    def test_returns_403_for_non_member(self, client):
        """Test that a user who is not a player of the game gets 403."""
        response = self.get(client, self.url('available.json'), token=self.outsider_token)
        assert response.status_code == 403

    def test_player_gets_200(self, client):
        """Test that a plain player of the game may list the catalog."""
        response = self.get(client, self.url('available.json'), token=self.other_token)
        assert response.status_code == 200

    def test_staff_gets_200(self, client):
        """Test that a staff user may list the catalog."""
        response = self.get(client, self.url('available.json'), token=self.staff_token)
        assert response.status_code == 200

    def test_excludes_hidden_and_known_recipes(self, client):
        """Test that hidden, known (hidden rows too) and other-game recipes are left out."""
        response = self.get(client, self.url('available.json'), token=self.other_token)
        names = [entry['name'] for entry in json.loads(response.content)]
        assert names == ['Fire Elixir', 'Venom Draught']

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is masked for every caller."""
        response = self.get(client, self.url('available.json'), token=self.dm_token)
        assert self.by_name(json.loads(response.content))['Venom Draught']['output'] is None

    def test_filters_by_name(self, client):
        """Test that ?name= matches GameRecipe.name case-insensitively."""
        url = self.url('available.json', query='?name=venom')
        response = self.get(client, url, token=self.other_token)
        assert [entry['name'] for entry in json.loads(response.content)] == ['Venom Draught']

    def test_hidden_npc_returns_404_before_permission_check(self, client):
        """Test that a hidden NPC is a 404 (not 401/403) even for a regular.create player (E7)."""
        self.hide_character()
        assert self.get(client, self.url('available.json')).status_code == 404
        response = self.get(client, self.url('available.json'), token=self.other_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_dm_gets_hidden_npc(self, client):
        """Test that the DM can list a hidden NPC's catalog."""
        self.hide_character()
        response = self.get(client, self.url('available.json'), token=self.dm_token)
        assert response.status_code == 200

    def test_sets_skip_cache_header(self, client):
        """Test that a successful response sets X-Skip-Cache: true."""
        response = self.get(client, self.url('available.json'), token=self.other_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-recipes-available',
            kwargs={'game_slug': 'test-game', 'character_id': self.npc.id},
        )
        assert self.get(client, url, token=self.other_token).status_code == 200
