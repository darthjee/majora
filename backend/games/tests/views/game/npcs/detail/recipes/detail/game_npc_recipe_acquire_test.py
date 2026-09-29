"""Tests for the NPC recipes/acquire.json view (regular.create; issue #1459)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_exchange_fixtures import (
    UNKNOWN_RECIPE_ID,
    CharacterRecipeExchangeFixtures,
)


@pytest.mark.django_db
class TestGameNpcRecipeAcquireView(CharacterRecipeExchangeFixtures):
    """Tests for POST /games/<slug>/npcs/<id>/recipes/acquire.json."""

    kind = 'npc'

    def setup_method(self):
        """Set up a NPC with known rows, a catalog and another game's recipes."""
        self.setup_exchange()

    def _acquire(self, client, game_recipe, token=None):
        """POST the acquire request for `game_recipe`, as the plain player by default."""
        token = token or self.other_token
        return self.post_recipe(client, 'acquire.json', game_recipe, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401 with X-Skip-Cache."""
        response = self.post_recipe(client, 'acquire.json', self.catalog_recipe)
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_403_for_non_member(self, client):
        """Test that a user who is not a player of the game gets 403 and nothing is created."""
        response = self._acquire(client, self.catalog_recipe, token=self.outsider_token)
        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'
        assert not self.link_exists(self.catalog_recipe)

    def test_player_acquires_with_plain_shape(self, client):
        """Test that a player gets 201 with the plain detail shape (no `hidden`)."""
        response = self._acquire(client, self.catalog_recipe)
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['game_recipe_id'] == self.catalog_recipe.id
        assert data['id'] == self.link_for(self.catalog_recipe).id
        assert 'hidden' not in data
        assert 'description' in data

    def test_staff_can_acquire(self, client):
        """Test that a staff user may acquire."""
        response = self._acquire(client, self.catalog_recipe, token=self.staff_token)
        assert response.status_code == 201

    def test_hidden_npc_returns_404_before_permission_check(self, client):
        """Test that a hidden NPC is a 404 (not 403) even for a regular.create player (E7)."""
        self.hide_character()
        response = self.post_recipe(client, 'acquire.json', self.catalog_recipe, self.other_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'
        assert not self.link_exists(self.catalog_recipe)

    def test_masks_hidden_output(self, client):
        """Test that a hidden output item is masked in the response, even for the DM."""
        response = self._acquire(client, self.masked_recipe, token=self.dm_token)
        assert json.loads(response.content)['output'] is None

    def test_copies_game_recipe_hidden_and_ignores_body_hidden(self, client):
        """Test that the row copies GameRecipe.hidden and a `hidden` in the body is ignored."""
        payload = {'game_recipe_id': self.catalog_recipe.id, 'hidden': True}
        self.post(client, self.url('acquire.json'), payload, token=self.other_token)
        assert self.link_for(self.catalog_recipe).hidden is False

    def test_ignores_unlisted_body_fields(self, client):
        """Test that `character`/`id` in the body have no effect (mass assignment)."""
        payload = {
            'game_recipe_id': self.catalog_recipe.id, 'character': 0, 'character_id': 0,
            'id': UNKNOWN_RECIPE_ID,
        }
        response = self.post(client, self.url('acquire.json'), payload, token=self.other_token)
        assert response.status_code == 201
        assert self.link_for(self.catalog_recipe).id != UNKNOWN_RECIPE_ID

    def test_other_game_recipe_returns_400_regardless_of_hidden(self, client):
        """Test that another game's recipe is a 400 with an identical body, hidden or not."""
        visible = self._acquire(client, self.other_game_recipe)
        hidden = self._acquire(client, self.other_game_hidden_recipe)
        assert visible.status_code == 400
        assert hidden.status_code == 400
        assert visible.content == hidden.content
        assert json.loads(visible.content) == {
            'errors': {'game_recipe_id': ['game_recipe_from_another_game']},
        }
        assert visible['X-Skip-Cache'] == 'true'

    def test_unknown_recipe_returns_404(self, client):
        """Test that an unknown game_recipe_id returns 404 with X-Skip-Cache."""
        response = self.post_recipe_id(client, 'acquire.json', UNKNOWN_RECIPE_ID, self.other_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_recipe_returns_404(self, client):
        """Test that a hidden GameRecipe returns 404 and nothing is created."""
        response = self._acquire(client, self.hidden_recipe, token=self.dm_token)
        assert response.status_code == 404
        assert not self.link_exists(self.hidden_recipe)

    def test_known_recipe_returns_422(self, client):
        """Test that an already-known recipe returns 422 (E4)."""
        response = self._acquire(client, self.visible_row.game_recipe)
        assert response.status_code == 422
        assert json.loads(response.content) == {
            'errors': {'game_recipe_id': ['game_recipe_already_known']},
        }
        assert response['X-Skip-Cache'] == 'true'

    def test_recipe_known_through_hidden_row_returns_422(self, client):
        """Test the known limitation: a recipe known only through a hidden row is still a 422."""
        response = self._acquire(client, self.hidden_row.game_recipe)
        assert response.status_code == 422

    def test_missing_id_returns_400(self, client):
        """Test that a missing game_recipe_id returns 400 with X-Skip-Cache."""
        response = self.post(client, self.url('acquire.json'), {}, token=self.other_token)
        assert response.status_code == 400
        assert response['X-Skip-Cache'] == 'true'

    def test_non_integer_id_returns_400(self, client):
        """Test that a non-integer game_recipe_id returns 400."""
        response = self.post_recipe_id(client, 'acquire.json', 'abc', self.other_token)
        assert response.status_code == 400

    def test_sets_skip_cache_header(self, client):
        """Test that a successful response sets X-Skip-Cache: true."""
        assert self._acquire(client, self.catalog_recipe)['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-npc-recipe-acquire',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        payload = {'game_recipe_id': self.catalog_recipe.id}
        assert self.post(client, url, payload, token=self.other_token).status_code == 201
