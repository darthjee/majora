"""Tests for the NPC recipes/<id>/full.json view (GameEdit; hidden-NPC gate first)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGameNpcRecipeDetailFullView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/npcs/<id>/recipes/<character_recipe_id>/full.json."""

    def setup_method(self):
        """Set up an NPC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.npc)

    def _url(self, row_id):
        """Return the recipe detail full URL for the given row of the fixture NPC."""
        return f'/games/test-game/npcs/{self.npc.id}/recipes/{row_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url(self.hidden_row.id)).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        response = self.get(client, self._url(self.hidden_row.id), token=self.other_token)
        assert response.status_code == 403

    def test_hidden_npc_returns_404_before_permission_check(self, client):
        """Test that a hidden NPC is a 404 for callers who cannot view it."""
        self.npc.hidden = True
        self.npc.save()
        response = self.get(client, self._url(self.hidden_row.id), token=self.other_token)
        assert response.status_code == 404

    def test_dm_gets_hidden_row_with_real_output(self, client):
        """Test that the DM gets a hidden row with hidden and the real output."""
        response = self.get(client, self._url(self.masked_row.id), token=self.dm_token)
        data = json.loads(response.content)
        assert data['hidden'] is False
        assert data['output']['id'] == self.hidden_item.id
        response = self.get(client, self._url(self.hidden_row.id), token=self.dm_token)
        assert json.loads(response.content)['hidden'] is True

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self._url(self.visible_row.id), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-npc-recipe-detail-full', kwargs={
            'game_slug': 'test-game', 'character_id': self.npc.id,
            'character_recipe_id': self.hidden_row.id,
        })
        assert self.get(client, url, token=self.dm_token).status_code == 200
