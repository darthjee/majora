"""Tests for the common_items/<id>/recipes/all.json view (GameEdit only, includes hidden)."""

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
class TestGameCommonItemRecipesAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/common_items/<id>/recipes/all.json."""

    def setup_method(self):
        """Set up a game, a DM, a player, a hidden common item and its recipes."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_token = self._member_token('dm_user', is_dm=True)
        self.player_token = self._member_token('player_user', is_dm=False)
        self.poison = GameCommonItemFactory(game=self.game, name='Secret Poison', hidden=True)
        GameRecipeFactory(game=self.game, game_common_item=self.poison, name='Brew')
        GameRecipeFactory(
            game=self.game, game_common_item=self.poison, name='Secret Brew', hidden=True,
        )
        GameRecipeFactory(game=self.game, name='Unrelated Recipe')

    def _member_token(self, username, is_dm):
        """Create a game member and return their auth token."""
        user = UserFactory(username=username, password='secret-password')
        PlayerFactory(game=self.game, user=user, is_dm=is_dm)
        return Token.objects.create(user=user)

    def _url(self, common_item_id=None):
        """Return the common item recipes/all URL (defaults to the fixture item)."""
        return f'/games/test-game/common_items/{common_item_id or self.poison.id}/recipes/all.json'

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url()).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        assert self.get(client, self._url(), token=self.player_token).status_code == 403

    def test_dm_gets_hidden_recipes_of_hidden_item(self, client):
        """Test that a DM gets every recipe of a hidden item, with hidden and real output."""
        data = json.loads(self.get(client, self._url(), token=self.dm_token).content)
        assert {item['name']: item['hidden'] for item in data} == {
            'Brew': False, 'Secret Brew': True,
        }
        assert data[0]['output']['id'] == self.poison.id

    def test_returns_404_for_other_game_common_item(self, client):
        """Test that a common item from another game returns 404."""
        other_item = GameCommonItemFactory(game=GameFactory(game_slug='other-game'))
        response = self.get(client, self._url(other_item.id), token=self.dm_token)
        assert response.status_code == 404

    def test_sets_skip_cache(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'
