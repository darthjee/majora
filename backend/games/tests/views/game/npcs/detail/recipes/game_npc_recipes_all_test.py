"""Tests for the NPC recipes/all.json view (GameEdit; hidden-NPC gate first)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGameNpcRecipesAllView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/npcs/<id>/recipes/all.json."""

    def setup_method(self):
        """Set up an NPC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.npc)

    def _url(self):
        """Return the recipes/all URL for the fixture NPC."""
        return f'/games/test-game/npcs/{self.npc.id}/recipes/all.json'

    def _hide_npc(self):
        """Mark the fixture NPC as hidden."""
        self.npc.hidden = True
        self.npc.save()

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url()).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        assert self.get(client, self._url(), token=self.other_token).status_code == 403

    def test_hidden_npc_returns_404_before_permission_check(self, client):
        """Test that a hidden NPC is a 404 (not 401/403) for callers who cannot view it."""
        self._hide_npc()
        assert self.get(client, self._url()).status_code == 404
        assert self.get(client, self._url(), token=self.other_token).status_code == 404

    def test_dm_gets_every_row_with_real_output(self, client):
        """Test that the DM gets every row with hidden and the real output."""
        response = self.get(client, self._url(), token=self.dm_token)
        by_name = self.by_name(json.loads(response.content))
        assert len(by_name) == 4
        assert by_name['Hidden Brew']['hidden'] is True
        assert by_name['Distill Poison']['output']['id'] == self.hidden_item.id

    def test_dm_gets_hidden_npc(self, client):
        """Test that the DM can list a hidden NPC's recipes."""
        self._hide_npc()
        assert self.get(client, self._url(), token=self.dm_token).status_code == 200

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        assert self.get(client, self._url(), token=self.dm_token)['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-recipes-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.npc.id},
        )
        assert self.get(client, url, token=self.dm_token).status_code == 200
