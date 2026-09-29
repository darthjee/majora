"""Tests for the PC recipes/remove/all.json view (issue #1459)."""

import pytest
from django.urls import reverse

from games.models import GameRecipe
from games.tests.views.game._character_recipe_exchange_fixtures import (
    CharacterRecipeExchangeFixtures,
)


@pytest.mark.django_db
class TestGamePcRecipeRemoveAllView(CharacterRecipeExchangeFixtures):
    """Tests for POST /games/<slug>/pcs/<id>/recipes/remove/all.json."""

    kind = 'pc'

    def setup_method(self):
        """Set up a PC with known rows, a catalog and another game's recipes."""
        self.setup_exchange()

    def _remove(self, client, game_recipe, token):
        """POST the remove/all request for `game_recipe` as `token`'s user."""
        return self.post_recipe(client, 'remove/all.json', game_recipe, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401 with X-Skip-Cache."""
        response = self._remove(client, self.hidden_row.game_recipe, token=None)
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_403_for_non_owner_player(self, client):
        """Test that a player who does not own the PC gets 403 (CharacterEdit)."""
        response = self._remove(client, self.hidden_row.game_recipe, token=self.other_token)
        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'

    def test_owner_removes_hidden_link(self, client):
        """Test that the owning player may remove a hidden row (CharacterEdit, E6)."""
        response = self._remove(client, self.hidden_row.game_recipe, token=self.owner_token)
        assert response.status_code == 204
        assert not self.link_exists(self.hidden_row.game_recipe)

    def test_dm_removes_hidden_link(self, client):
        """Test that the DM may remove a hidden row."""
        response = self._remove(client, self.hidden_row.game_recipe, token=self.dm_token)
        assert response.status_code == 204

    def test_keeps_game_recipe(self, client):
        """Test that removing a link never deletes the GameRecipe."""
        game_recipe = self.hidden_row.game_recipe
        self._remove(client, game_recipe, token=self.dm_token)
        assert GameRecipe.objects.filter(id=game_recipe.id).exists()

    def test_unknown_link_returns_404(self, client):
        """Test that a recipe the character does not know returns 404 (E8)."""
        response = self._remove(client, self.catalog_recipe, token=self.dm_token)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_header(self, client):
        """Test that a successful response sets X-Skip-Cache: true."""
        response = self._remove(client, self.visible_row.game_recipe, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-recipe-remove-all',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        payload = {'game_recipe_id': self.hidden_row.game_recipe.id}
        assert self.post(client, url, payload, token=self.dm_token).status_code == 204
