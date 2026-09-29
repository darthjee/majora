"""Tests for the PC recipes/<id>/full.json view (CharacterEdit; includes hidden rows)."""

import json

import pytest
from django.urls import reverse

from games.tests.factories import CharacterFactory, CharacterRecipeFactory
from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGamePcRecipeDetailFullView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/pcs/<id>/recipes/<character_recipe_id>/full.json."""

    def setup_method(self):
        """Set up a PC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.pc)

    def _url(self, row_id):
        """Return the recipe detail full URL for the given row of the fixture PC."""
        return f'/games/test-game/pcs/{self.pc.id}/recipes/{row_id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url(self.hidden_row.id)).status_code == 401

    def test_returns_403_for_non_owner_player(self, client):
        """Test that a player who does not own the PC gets 403."""
        response = self.get(client, self._url(self.hidden_row.id), token=self.other_token)
        assert response.status_code == 403

    def test_owner_gets_hidden_row_with_hidden_flag(self, client):
        """Test that the owning player gets a hidden row with its hidden flag."""
        response = self.get(client, self._url(self.hidden_row.id), token=self.owner_token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['hidden'] is True
        assert {'description', 'ingredients', 'checks'} <= set(data)

    def test_owner_still_gets_hidden_output_masked(self, client):
        """Test that the owning player without GameEdit still sees a hidden output as null."""
        response = self.get(client, self._url(self.masked_row.id), token=self.owner_token)
        assert json.loads(response.content)['output'] is None

    def test_dm_gets_hidden_output_unmasked(self, client):
        """Test that a GameEdit caller gets the real output."""
        response = self.get(client, self._url(self.masked_row.id), token=self.dm_token)
        assert json.loads(response.content)['output']['id'] == self.hidden_item.id

    def test_returns_404_for_other_character_row(self, client):
        """Test that another character's row id returns 404."""
        other_row = CharacterRecipeFactory(character=CharacterFactory(game=self.game, npc=False))
        response = self.get(client, self._url(other_row.id), token=self.dm_token)
        assert response.status_code == 404

    def test_sets_skip_cache_header(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self._url(self.visible_row.id), token=self.owner_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-pc-recipe-detail-full', kwargs={
            'game_slug': 'test-game', 'character_id': self.pc.id,
            'character_recipe_id': self.hidden_row.id,
        })
        assert self.get(client, url, token=self.owner_token).status_code == 200
