"""Tests for the game recipes/<id>/full.json view (GameEdit only, includes hidden)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
    PlayerFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameRecipeDetailFullView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/recipes/<id>/full.json."""

    def setup_method(self):
        """Set up a game, a DM, a player and a hidden recipe with a hidden output."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_token = self._member_token('dm_user', is_dm=True)
        self.player_token = self._member_token('player_user', is_dm=False)
        self.poison = GameCommonItemFactory(game=self.game, name='Secret Poison', hidden=True)
        self.recipe = GameRecipeFactory(
            game=self.game, game_common_item=self.poison, name='Secret Brew', hidden=True,
        )

    def _member_token(self, username, is_dm):
        """Create a game member and return their auth token."""
        user = UserFactory(username=username, password='secret-password')
        PlayerFactory(game=self.game, user=user, is_dm=is_dm)
        return Token.objects.create(user=user)

    def _url(self, recipe_id=None):
        """Return the recipe full URL for the given id (defaults to the fixture)."""
        return f'/games/test-game/recipes/{recipe_id or self.recipe.id}/full.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url()).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        assert self.get(client, self._url(), token=self.player_token).status_code == 403

    def test_dm_gets_hidden_recipe_with_real_output(self, client):
        """Test that a DM gets a hidden recipe with hidden and its real output."""
        data = json.loads(self.get(client, self._url(), token=self.dm_token).content)
        assert data['hidden'] is True
        assert data['output']['id'] == self.poison.id
        assert 'checks' in data

    def test_returns_404_for_other_game_recipe(self, client):
        """Test that a recipe from another game returns 404."""
        recipe = GameRecipeFactory(game=GameFactory(game_slug='other-game'))
        response = self.get(client, self._url(recipe.id), token=self.dm_token)
        assert response.status_code == 404

    def test_sets_skip_cache(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'
