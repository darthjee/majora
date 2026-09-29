"""Tests for PATCH on the NPC recipes/<id>.json view (GameEdit; hidden-NPC gate first)."""

import json

import pytest

from games.tests.factories import CharacterFactory, CharacterRecipeFactory
from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGameNpcRecipeDetailPatchView(CharacterRecipeViewFixtures):
    """Tests for PATCH /games/<slug>/npcs/<id>/recipes/<character_recipe_id>.json."""

    def setup_method(self):
        """Set up an NPC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.npc)

    def _url(self, row_id):
        """Return the recipe detail URL for the given row of the fixture NPC."""
        return f'/games/test-game/npcs/{self.npc.id}/recipes/{row_id}.json'

    def _patch(self, client, row_id, payload, token=None):
        """PATCH the given row with `payload`."""
        return self.patch(client, self._url(row_id), payload, token=token)

    def _hide_npc(self):
        """Mark the fixture NPC as hidden."""
        self.npc.hidden = True
        self.npc.save()

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self._patch(client, self.hidden_row.id, {'hidden': False}).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        response = self._patch(client, self.hidden_row.id, {'hidden': False}, self.other_token)
        assert response.status_code == 403

    def test_non_editor_gets_403_not_404_for_unknown_row(self, client):
        """Test that the permission check runs before the row lookup."""
        response = self._patch(client, 99999, {'hidden': False}, self.other_token)
        assert response.status_code == 403

    def test_hidden_npc_returns_404_before_permission_check(self, client):
        """Test that a hidden NPC is a 404 (not 401/403) for callers who cannot view it."""
        self._hide_npc()
        assert self._patch(client, self.hidden_row.id, {'hidden': False}).status_code == 404
        response = self._patch(client, self.hidden_row.id, {'hidden': False}, self.other_token)
        assert response.status_code == 404

    def test_dm_can_unhide_row_of_hidden_npc(self, client):
        """Test that the DM can unhide a row, even on a hidden NPC."""
        self._hide_npc()
        response = self._patch(client, self.hidden_row.id, {'hidden': False}, self.dm_token)
        assert response.status_code == 200
        assert json.loads(response.content)['hidden'] is False
        self.hidden_row.refresh_from_db()
        assert self.hidden_row.hidden is False

    def test_unhiding_ignores_hidden_game_recipe(self, client):
        """Test that GameRecipe.hidden does not block the PATCH (E9)."""
        response = self._patch(client, self.secret_recipe_row.id, {'hidden': True}, self.dm_token)
        assert response.status_code == 200

    def test_ignores_other_fields(self, client):
        """Test that fields other than hidden are ignored."""
        self._patch(client, self.visible_row.id, {
            'hidden': True, 'character': self.pc.id, 'game_recipe_id': 99999,
        }, self.dm_token)
        self.visible_row.refresh_from_db()
        assert self.visible_row.character_id == self.npc.id
        assert self.visible_row.hidden is True

    def test_dm_response_unmasks_hidden_output(self, client):
        """Test that the DM's PATCH response returns the real output."""
        response = self._patch(client, self.masked_row.id, {'hidden': True}, self.dm_token)
        assert json.loads(response.content)['output']['id'] == self.hidden_item.id

    def test_returns_404_for_other_character_row(self, client):
        """Test that another character's row id returns 404."""
        other_row = CharacterRecipeFactory(character=CharacterFactory(game=self.game))
        response = self._patch(client, other_row.id, {'hidden': True}, self.dm_token)
        assert response.status_code == 404

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self._patch(client, self.visible_row.id, {'hidden': True}, self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_records_history(self, client):
        """Test that the update is recorded in the row's history."""
        before = self.visible_row.history.count()
        self._patch(client, self.visible_row.id, {'hidden': True}, self.dm_token)
        assert self.visible_row.history.count() == before + 1
