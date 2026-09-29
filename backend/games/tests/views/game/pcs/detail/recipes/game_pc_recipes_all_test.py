"""Tests for the PC recipes/all.json view (CharacterEdit; includes hidden rows)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGamePcRecipesAllView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/pcs/<id>/recipes/all.json."""

    def setup_method(self):
        """Set up a PC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.pc)

    def _url(self, query=''):
        """Return the recipes/all URL for the fixture PC."""
        return f'/games/test-game/pcs/{self.pc.id}/recipes/all.json{query}'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url()).status_code == 401

    def test_returns_403_for_non_owner_player(self, client):
        """Test that a player who does not own the PC gets 403."""
        assert self.get(client, self._url(), token=self.other_token).status_code == 403

    def test_owner_gets_every_row_with_hidden(self, client):
        """Test that the owning player gets all rows with their own hidden flag."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response.status_code == 200
        by_name = self.by_name(json.loads(response.content))
        assert len(by_name) == 4
        assert by_name['Hidden Brew']['hidden'] is True
        assert by_name['Secret Recipe']['hidden'] is False

    def test_owner_still_gets_hidden_output_masked(self, client):
        """Test that the owning player without GameEdit still sees a hidden output as null."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert self.by_name(json.loads(response.content))['Distill Poison']['output'] is None

    def test_dm_gets_hidden_output_unmasked(self, client):
        """Test that a GameEdit caller gets the real output."""
        response = self.get(client, self._url(), token=self.dm_token)
        output = self.by_name(json.loads(response.content))['Distill Poison']['output']
        assert output['id'] == self.hidden_item.id

    def test_filters_by_name(self, client):
        """Test that ?name= matches GameRecipe.name case-insensitively."""
        response = self.get(client, self._url(query='?name=BREW'), token=self.dm_token)
        names = sorted(entry['name'] for entry in json.loads(response.content))
        assert names == ['Brew Potion', 'Hidden Brew']

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self._url(), token=self.owner_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-recipes-all', kwargs={'game_slug': 'test-game', 'character_id': self.pc.id},
        )
        assert self.get(client, url, token=self.owner_token).status_code == 200
