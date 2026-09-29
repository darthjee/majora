"""Tests for the NPC recipes/<id>.json view (AllowAny + hidden-NPC gate)."""

import json

import pytest
from django.urls import reverse

from games.tests.factories import CharacterFactory, CharacterRecipeFactory
from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGameNpcRecipeDetailView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/npcs/<id>/recipes/<character_recipe_id>.json."""

    def setup_method(self):
        """Set up an NPC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.npc)

    def _url(self, row_id):
        """Return the recipe detail URL for the given row of the fixture NPC."""
        return f'/games/test-game/npcs/{self.npc.id}/recipes/{row_id}.json'

    def _hide_npc(self):
        """Mark the fixture NPC as hidden."""
        self.npc.hidden = True
        self.npc.save()

    def test_returns_visible_row(self, client):
        """Test that a visible row returns 200 without hidden."""
        response = self.get(client, self._url(self.visible_row.id))
        assert response.status_code == 200
        assert 'hidden' not in json.loads(response.content)

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is masked to null."""
        response = self.get(client, self._url(self.masked_row.id))
        assert json.loads(response.content)['output'] is None

    def test_returns_404_for_hidden_row(self, client):
        """Test that a hidden row returns 404."""
        assert self.get(client, self._url(self.hidden_row.id)).status_code == 404

    def test_returns_404_for_other_character_row(self, client):
        """Test that another character's row id returns 404."""
        other_row = CharacterRecipeFactory(character=CharacterFactory(game=self.game))
        assert self.get(client, self._url(other_row.id)).status_code == 404

    def test_hidden_npc_returns_404_for_player(self, client):
        """Test that a hidden NPC returns 404 to a caller who cannot view it."""
        self._hide_npc()
        response = self.get(client, self._url(self.visible_row.id), token=self.other_token)
        assert response.status_code == 404

    def test_hidden_npc_served_to_dm_skips_cache(self, client):
        """Test that a DM served a hidden NPC gets 200 with X-Skip-Cache."""
        self._hide_npc()
        response = self.get(client, self._url(self.visible_row.id), token=self.dm_token)
        assert response.status_code == 200
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-npc-recipe-detail', kwargs={
            'game_slug': 'test-game', 'character_id': self.npc.id,
            'character_recipe_id': self.visible_row.id,
        })
        assert self.get(client, url).status_code == 200
