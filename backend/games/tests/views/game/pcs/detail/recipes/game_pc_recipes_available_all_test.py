"""Tests for the PC recipes/available/all.json view (GameEdit; issue #1459)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_exchange_fixtures import (
    CharacterRecipeExchangeFixtures,
)


@pytest.mark.django_db
class TestGamePcRecipesAvailableAllView(CharacterRecipeExchangeFixtures):
    """Tests for GET /games/<slug>/pcs/<id>/recipes/available/all.json."""

    kind = 'pc'

    def setup_method(self):
        """Set up a PC with known rows, a catalog and another game's recipes."""
        self.setup_exchange()

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self.url('available/all.json')).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a plain player (regular.create only) gets 403."""
        response = self.get(client, self.url('available/all.json'), token=self.other_token)
        assert response.status_code == 403

    def test_returns_403_for_owner(self, client):
        """Test that the owning player is rejected (no owner leniency)."""
        response = self.get(client, self.url('available/all.json'), token=self.owner_token)
        assert response.status_code == 403

    def test_dm_gets_hidden_recipes_with_hidden_flag(self, client):
        """Test that hidden GameRecipes are included, with `hidden`, minus known recipes."""
        response = self.get(client, self.url('available/all.json'), token=self.dm_token)
        by_name = self.by_name(json.loads(response.content))
        assert sorted(by_name) == ['Fire Elixir', 'Forbidden Tonic', 'Venom Draught']
        assert by_name['Forbidden Tonic']['hidden'] is True
        assert by_name['Fire Elixir']['hidden'] is False

    def test_dm_gets_real_output(self, client):
        """Test that a hidden output item is returned unmasked."""
        response = self.get(client, self.url('available/all.json'), token=self.dm_token)
        output = self.by_name(json.loads(response.content))['Venom Draught']['output']
        assert output['id'] == self.hidden_item.id

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self.url('available/all.json'), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_header_on_denial(self, client):
        """Test that a permission denial sets X-Skip-Cache: true."""
        response = self.get(client, self.url('available/all.json'), token=self.other_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-recipes-available-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        assert self.get(client, url, token=self.dm_token).status_code == 200
