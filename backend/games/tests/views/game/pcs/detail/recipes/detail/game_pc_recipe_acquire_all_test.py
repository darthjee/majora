"""Tests for the PC recipes/acquire/all.json view (GameEdit; issue #1459)."""

import json

import pytest
from django.urls import reverse

from games.tests.views.game._character_recipe_exchange_fixtures import (
    UNKNOWN_RECIPE_ID,
    CharacterRecipeExchangeFixtures,
)


@pytest.mark.django_db
class TestGamePcRecipeAcquireAllView(CharacterRecipeExchangeFixtures):
    """Tests for POST /games/<slug>/pcs/<id>/recipes/acquire/all.json."""

    kind = 'pc'

    def setup_method(self):
        """Set up a PC with known rows, a catalog and another game's recipes."""
        self.setup_exchange()

    def _acquire(self, client, game_recipe, token=None):
        """POST the acquire/all request for `game_recipe`, as the DM by default."""
        token = token or self.dm_token
        return self.post_recipe(client, 'acquire/all.json', game_recipe, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401 with X-Skip-Cache."""
        response = self.post_recipe(client, 'acquire/all.json', self.catalog_recipe)
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_403_for_player(self, client):
        """Test that a plain player (regular.create only) gets 403."""
        response = self._acquire(client, self.catalog_recipe, token=self.other_token)
        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_403_for_owner(self, client):
        """Test that the owning player is rejected (no owner leniency)."""
        response = self._acquire(client, self.catalog_recipe, token=self.owner_token)
        assert response.status_code == 403

    def test_dm_acquires_hidden_recipe_as_hidden_row(self, client):
        """Test that a hidden GameRecipe is accepted and the new row copies hidden=True."""
        response = self._acquire(client, self.hidden_recipe)
        assert response.status_code == 201
        assert self.link_for(self.hidden_recipe).hidden is True
        assert json.loads(response.content)['hidden'] is True

    def test_ignores_body_hidden(self, client):
        """Test that a `hidden` in the body is ignored: the row copies GameRecipe.hidden."""
        payload = {'game_recipe_id': self.hidden_recipe.id, 'hidden': False}
        self.post(client, self.url('acquire/all.json'), payload, token=self.dm_token)
        assert self.link_for(self.hidden_recipe).hidden is True

    def test_returns_full_shape_with_real_output(self, client):
        """Test that the response is the /full.json shape with the real output."""
        data = json.loads(self._acquire(client, self.masked_recipe).content)
        assert data['hidden'] is False
        assert data['output']['id'] == self.hidden_item.id
        assert 'description' in data

    def test_other_game_recipe_returns_400_regardless_of_hidden(self, client):
        """Test that another game's recipe is a 400 with an identical body, hidden or not."""
        visible = self._acquire(client, self.other_game_recipe)
        hidden = self._acquire(client, self.other_game_hidden_recipe)
        assert visible.status_code == 400
        assert visible.content == hidden.content

    def test_unknown_recipe_returns_404(self, client):
        """Test that an unknown game_recipe_id returns 404."""
        response = self.post_recipe_id(client, 'acquire/all.json', UNKNOWN_RECIPE_ID, self.dm_token)
        assert response.status_code == 404

    def test_known_recipe_returns_422(self, client):
        """Test that an already-known recipe (hidden row included) returns 422 (E4)."""
        assert self._acquire(client, self.visible_row.game_recipe).status_code == 422
        assert self._acquire(client, self.hidden_row.game_recipe).status_code == 422

    def test_sets_skip_cache_header(self, client):
        """Test that a successful response sets X-Skip-Cache: true."""
        assert self._acquire(client, self.catalog_recipe)['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-recipe-acquire-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        payload = {'game_recipe_id': self.catalog_recipe.id}
        assert self.post(client, url, payload, token=self.dm_token).status_code == 201
