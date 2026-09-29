"""Tests for the PC recipes/<id>.json view (AllowAny; 404 for hidden rows)."""

import json

import pytest
from django.urls import reverse

from games.tests.factories import CharacterFactory, CharacterRecipeFactory
from games.tests.views.game._character_recipe_fixtures import CharacterRecipeViewFixtures


@pytest.mark.django_db
class TestGamePcRecipeDetailView(CharacterRecipeViewFixtures):
    """Tests for GET /games/<slug>/pcs/<id>/recipes/<character_recipe_id>.json."""

    def setup_method(self):
        """Set up a PC knowing visible, masked-output, hidden-recipe and hidden rows."""
        self.setup_users()
        self.setup_recipes(self.pc)

    def _url(self, row_id, character_id=None):
        """Return the recipe detail URL for the given row (on the fixture PC by default)."""
        character_id = character_id if character_id is not None else self.pc.id
        return f'/games/test-game/pcs/{character_id}/recipes/{row_id}.json'

    def test_returns_detail_fields_without_hidden(self, client):
        """Test that the detail exposes markdown fields and no hidden flag."""
        response = self.get(client, self._url(self.visible_row.id))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['id'] == self.visible_row.id
        assert {'description', 'ingredients', 'checks'} <= set(data)
        assert 'hidden' not in data

    def test_returns_row_of_hidden_game_recipe(self, client):
        """Test that GameRecipe.hidden is ignored on the detail (E9)."""
        assert self.get(client, self._url(self.secret_recipe_row.id)).status_code == 200

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is masked to null."""
        response = self.get(client, self._url(self.masked_row.id), token=self.dm_token)
        assert json.loads(response.content)['output'] is None

    def test_returns_404_for_hidden_row(self, client):
        """Test that a hidden row returns 404."""
        response = self.get(client, self._url(self.hidden_row.id), token=self.dm_token)
        assert response.status_code == 404

    def test_returns_404_for_unknown_row(self, client):
        """Test that an unknown row id returns 404."""
        assert self.get(client, self._url(99999)).status_code == 404

    def test_returns_404_for_other_character_row(self, client):
        """Test that another character's row id returns 404."""
        other_pc = CharacterFactory(game=self.game, npc=False)
        other_row = CharacterRecipeFactory(character=other_pc)
        assert self.get(client, self._url(other_row.id)).status_code == 404

    def test_sets_no_skip_cache_header(self, client):
        """Test that the plain PC detail sets no X-Skip-Cache header."""
        assert 'X-Skip-Cache' not in self.get(client, self._url(self.visible_row.id))

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('game-pc-recipe-detail', kwargs={
            'game_slug': 'test-game', 'character_id': self.pc.id,
            'character_recipe_id': self.visible_row.id,
        })
        assert self.get(client, url).status_code == 200
