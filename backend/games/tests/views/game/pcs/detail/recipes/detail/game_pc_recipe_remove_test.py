"""Tests for the PC recipes/remove.json view (regular.create; issue #1459)."""

import pytest
from django.urls import reverse

from games.models import GameRecipe
from games.tests.views.game._character_recipe_exchange_fixtures import (
    CharacterRecipeExchangeFixtures,
)


@pytest.mark.django_db
class TestGamePcRecipeRemoveView(CharacterRecipeExchangeFixtures):
    """Tests for POST /games/<slug>/pcs/<id>/recipes/remove.json."""

    kind = 'pc'

    def setup_method(self):
        """Set up a PC with known rows, a catalog and another game's recipes."""
        self.setup_exchange()

    def _remove(self, client, game_recipe, token=None):
        """POST the remove request for `game_recipe`, as the plain player by default."""
        token = token or self.other_token
        return self.post_recipe(client, 'remove.json', game_recipe, token=token)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401 with X-Skip-Cache."""
        response = self.post_recipe(client, 'remove.json', self.visible_row.game_recipe)
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_403_for_non_member(self, client):
        """Test that a user who is not a player of the game gets 403 and nothing is removed."""
        game_recipe = self.visible_row.game_recipe
        response = self._remove(client, game_recipe, token=self.outsider_token)
        assert response.status_code == 403
        assert self.link_exists(game_recipe)

    def test_player_removes_link_but_keeps_game_recipe(self, client):
        """Test that a player gets 204, the row is deleted and the GameRecipe survives."""
        game_recipe = self.visible_row.game_recipe
        response = self._remove(client, game_recipe)
        assert response.status_code == 204
        assert not self.link_exists(game_recipe)
        assert GameRecipe.objects.filter(id=game_recipe.id).exists()

    def test_staff_can_remove(self, client):
        """Test that a staff user may remove."""
        response = self._remove(client, self.visible_row.game_recipe, token=self.staff_token)
        assert response.status_code == 204

    def test_owner_can_remove(self, client):
        """Test that the owning player (also a player of the game) may remove."""
        response = self._remove(client, self.visible_row.game_recipe, token=self.owner_token)
        assert response.status_code == 204

    def test_unknown_link_returns_404(self, client):
        """Test that a recipe the character does not know returns 404 (E8)."""
        response = self._remove(client, self.catalog_recipe)
        assert response.status_code == 404
        assert response['X-Skip-Cache'] == 'true'

    def test_hidden_link_returns_404(self, client):
        """Test that a recipe known through a hidden row returns 404 and is kept (E6)."""
        response = self._remove(client, self.hidden_row.game_recipe, token=self.dm_token)
        assert response.status_code == 404
        assert self.link_exists(self.hidden_row.game_recipe)

    def test_missing_id_returns_400(self, client):
        """Test that a missing game_recipe_id returns 400 with X-Skip-Cache."""
        response = self.post(client, self.url('remove.json'), {}, token=self.other_token)
        assert response.status_code == 400
        assert response['X-Skip-Cache'] == 'true'

    def test_sets_skip_cache_header(self, client):
        """Test that a successful response sets X-Skip-Cache: true."""
        response = self._remove(client, self.visible_row.game_recipe)
        assert response['X-Skip-Cache'] == 'true'

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-pc-recipe-remove',
            kwargs={'game_slug': 'test-game', 'character_id': self.character.id},
        )
        payload = {'game_recipe_id': self.visible_row.game_recipe.id}
        assert self.post(client, url, payload, token=self.other_token).status_code == 204
