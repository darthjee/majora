"""Tests for the NPC recipes.json view (AllowAny + hidden-NPC gate)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGameNpcRecipesView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/npcs/<id>/recipes.json."""

    def setup_method(self):
        """Set up an NPC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.npc)

    def _url(self, character_id=None):
        """Return the recipes URL for the given NPC (defaults to the fixture)."""
        character_id = character_id if character_id is not None else self.npc.id
        return f'/games/test-game/npcs/{character_id}/recipes.json'

    def _hide_npc(self):
        """Mark the fixture NPC as hidden."""
        self.npc.hidden = True
        self.npc.save()

    def test_excludes_hidden_rows_and_keeps_hidden_game_recipe(self, client):
        """Test that hidden rows are excluded while GameRecipe.hidden is ignored (E9)."""
        names = set(self.by_name(json.loads(self.get(client, self._url()).content)))
        assert names == {'Brew Potion', 'Distill Poison', 'Secret Recipe'}

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is masked to null."""
        data = json.loads(self.get(client, self._url()).content)
        assert self.by_name(data)['Distill Poison']['output'] is None

    def test_hidden_npc_returns_404_for_player(self, client):
        """Test that a hidden NPC returns 404 to a caller who cannot view it."""
        self._hide_npc()
        assert self.get(client, self._url(), token=self.other_token).status_code == 404

    def test_hidden_npc_served_to_dm_skips_cache(self, client):
        """Test that a DM served a hidden NPC gets 200 with X-Skip-Cache."""
        self._hide_npc()
        response = self.get(client, self._url(), token=self.dm_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'

    def test_visible_npc_sets_no_skip_cache_header(self, client):
        """Test that a visible NPC's index sets no X-Skip-Cache header."""
        assert 'X-Skip-Cache' not in self.get(client, self._url())

    def test_incognito_npc_has_no_effect(self, client):
        """Test that an incognito NPC's recipes are still listed."""
        self.npc.incognito = True
        self.npc.save()
        assert len(json.loads(self.get(client, self._url()).content)) == 3

    def test_returns_404_for_pc_id(self, client):
        """Test that a PC id on the NPC route returns 404."""
        assert self.get(client, self._url(character_id=self.pc.id)).status_code == 404

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-recipes', kwargs={'game_slug': 'test-game', 'character_id': self.npc.id},
        )
        assert self.get(client, url).status_code == 200
