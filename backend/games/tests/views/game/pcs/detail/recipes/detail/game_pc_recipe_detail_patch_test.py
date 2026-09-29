"""Tests for PATCH on the PC recipes/<id>.json view (CharacterEdit; `hidden` only)."""

import json

import pytest

from games.tests.factories import CharacterFactory, CharacterRecipeFactory
from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGamePcRecipeDetailPatchView(CharacterRecipeViewFixtures):
    """Tests for PATCH /games/<slug>/pcs/<id>/recipes/<character_recipe_id>.json."""

    def setup_method(self):
        """Set up a PC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.pc)

    def _url(self, row_id):
        """Return the recipe detail URL for the given row of the fixture PC."""
        return f'/games/test-game/pcs/{self.pc.id}/recipes/{row_id}.json'

    def _patch(self, client, row_id, payload, token=None):
        """PATCH the given row with `payload`."""
        return self.patch(client, self._url(row_id), payload, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self._patch(client, self.hidden_row.id, {'hidden': False}).status_code == 401

    def test_returns_403_for_non_owner_player(self, client):
        """Test that a player who does not own the PC gets 403."""
        response = self._patch(client, self.hidden_row.id, {'hidden': False}, self.other_token)
        assert response.status_code == 403

    def test_non_editor_gets_403_not_404_for_unknown_row(self, client):
        """Test that the permission check runs before the row lookup."""
        response = self._patch(client, 99999, {'hidden': False}, self.other_token)
        assert response.status_code == 403

    def test_owner_can_unhide_row_of_hidden_game_recipe(self, client):
        """Test that the owner can unhide a row, ignoring GameRecipe.hidden (E9)."""
        self.hidden_row.game_recipe.hidden = True
        self.hidden_row.game_recipe.save()
        response = self._patch(client, self.hidden_row.id, {'hidden': False}, self.owner_token)
        assert response.status_code == 200
        assert json.loads(response.content)['hidden'] is False
        self.hidden_row.refresh_from_db()
        assert self.hidden_row.hidden is False

    def test_dm_can_hide_row(self, client):
        """Test that the DM can hide a visible row."""
        response = self._patch(client, self.visible_row.id, {'hidden': True}, self.dm_token)
        assert response.status_code == 200
        self.visible_row.refresh_from_db()
        assert self.visible_row.hidden is True

    def test_ignores_other_fields(self, client):
        """Test that fields other than hidden are ignored."""
        other_character = CharacterFactory(game=self.game, npc=False)
        original_recipe_id = self.visible_row.game_recipe_id
        self._patch(client, self.visible_row.id, {
            'hidden': True, 'character': other_character.id, 'game_recipe': 99999,
            'game_recipe_id': 99999, 'name': 'Renamed',
        }, self.dm_token)
        self.visible_row.refresh_from_db()
        assert self.visible_row.character_id == self.pc.id
        assert self.visible_row.game_recipe_id == original_recipe_id
        assert self.visible_row.game_recipe.name == 'Brew Potion'

    def test_response_uses_full_shape(self, client):
        """Test that the response carries the detail fields plus hidden."""
        response = self._patch(client, self.visible_row.id, {'hidden': True}, self.dm_token)
        data = json.loads(response.content)
        assert {'description', 'ingredients', 'checks', 'hidden'} <= set(data)

    def test_owner_response_masks_hidden_output(self, client):
        """Test that the owner's PATCH response still masks a hidden output."""
        response = self._patch(client, self.masked_row.id, {'hidden': True}, self.owner_token)
        assert json.loads(response.content)['output'] is None

    def test_dm_response_unmasks_hidden_output(self, client):
        """Test that a GameEdit caller's PATCH response returns the real output."""
        response = self._patch(client, self.masked_row.id, {'hidden': True}, self.dm_token)
        assert json.loads(response.content)['output']['id'] == self.hidden_item.id

    def test_returns_404_for_other_character_row(self, client):
        """Test that another character's row id returns 404."""
        other_row = CharacterRecipeFactory(character=CharacterFactory(game=self.game, npc=False))
        response = self._patch(client, other_row.id, {'hidden': True}, self.dm_token)
        assert response.status_code == 404

    def test_returns_400_for_invalid_hidden(self, client):
        """Test that a non-boolean hidden value returns 400."""
        response = self._patch(client, self.visible_row.id, {'hidden': 'maybe'}, self.dm_token)
        assert response.status_code == 400

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self._patch(client, self.visible_row.id, {'hidden': True}, self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_records_history(self, client):
        """Test that the update is recorded in the row's history."""
        before = self.visible_row.history.count()
        self._patch(client, self.visible_row.id, {'hidden': True}, self.dm_token)
        assert self.visible_row.history.count() == before + 1
        assert self.visible_row.history.first().hidden is True
