"""Tests for the PC recipes.json view (AllowAny; non-hidden rows, output masked)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGamePcRecipesView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/pcs/<id>/recipes.json."""

    def setup_method(self):
        """Set up a PC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.pc)

    def _url(self, character_id=None, query=''):
        """Return the recipes URL for the given PC (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.pc.id
        return f'/games/test-game/pcs/{character_id}/recipes.json{query}'

    def test_excludes_hidden_rows(self, client):
        """Test that a hidden CharacterRecipe row is excluded."""
        data = json.loads(self.get(client, self._url()).content)
        assert 'Hidden Brew' not in self.by_name(data)

    def test_includes_visible_row_of_hidden_game_recipe(self, client):
        """Test that GameRecipe.hidden is ignored on character endpoints (E9)."""
        data = json.loads(self.get(client, self._url()).content)
        assert 'Secret Recipe' in self.by_name(data)

    def test_returns_index_fields_without_hidden(self, client):
        """Test that entries expose the index fields and no hidden flag."""
        data = json.loads(self.get(client, self._url()).content)
        entry = self.by_name(data)['Brew Potion']
        assert entry['id'] == self.visible_row.id
        assert entry['game_recipe_id'] == self.visible_row.game_recipe_id
        assert 'hidden' not in entry
        assert 'description' not in entry

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is masked to null."""
        data = json.loads(self.get(client, self._url()).content)
        assert self.by_name(data)['Distill Poison']['output'] is None
        assert self.by_name(data)['Brew Potion']['output']['name'] == 'Healing Potion'

    def test_masks_hidden_output_even_for_dm(self, client):
        """Test that the plain variant masks the output even for a GameEdit caller."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert self.by_name(json.loads(response.content))['Distill Poison']['output'] is None

    def test_filters_by_name(self, client):
        """Test that ?name= matches GameRecipe.name case-insensitively."""
        data = json.loads(self.get(client, self._url(query='?name=potion')).content)
        assert [entry['name'] for entry in data] == ['Brew Potion']

    def test_sets_no_skip_cache_header(self, client):
        """Test that the plain PC index sets no X-Skip-Cache header."""
        response = self.get(client, self._url())
        assert 'X-Skip-Cache' not in response

    def test_returns_404_for_unknown_character(self, client):
        """Test that an unknown character id returns 404."""
        assert self.get(client, self._url(character_id=99999)).status_code == 404

    def test_returns_404_for_npc_id(self, client):
        """Test that an NPC id on the PC route returns 404."""
        assert self.get(client, self._url(character_id=self.npc.id)).status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-recipes', kwargs={'game_slug': 'test-game', 'character_id': self.pc.id},
        )
        assert self.get(client, url).status_code == 200
