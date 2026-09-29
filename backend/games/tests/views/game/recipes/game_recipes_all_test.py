"""Tests for the game recipes/all.json view (GameEdit only, includes hidden)."""

import json

import pytest
from rest_framework.authtoken.models import Token

from games.models import GameCommonItem
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import (
    GameCommonItemFactory,
    GameFactory,
    GameRecipeFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


@pytest.mark.django_db
class TestGameRecipesAllView(TokenAuthRequestMixin):
    """Tests for GET /games/<slug>/recipes/all.json."""

    def setup_method(self):
        """Set up a game, a DM, a player and visible/hidden recipes."""
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.dm_token = self._member_token('dm_user', is_dm=True)
        self.player_token = self._member_token('player_user', is_dm=False)
        self.poison = GameCommonItemFactory(
            game=self.game, name='Secret Poison', hidden=True,
            category=GameCommonItem.CATEGORY_POISON,
        )
        self.visible = GameRecipeFactory(game=self.game, name='Brew Potion')
        self.hidden = GameRecipeFactory(
            game=self.game, game_common_item=self.poison, name='Secret Brew', hidden=True,
        )

    def _member_token(self, username, is_dm):
        """Create a game member and return their auth token."""
        user = UserFactory(username=username, password='secret-password')
        PlayerFactory(game=self.game, user=user, is_dm=is_dm)
        return Token.objects.create(user=user)

    def _url(self, query=''):
        """Return the recipes/all URL, with an optional query string."""
        return f'/games/test-game/recipes/all.json{query}'

    def _data(self, client, query=''):
        """Return the DM's decoded response for the given query string."""
        return json.loads(self.get(client, self._url(query), token=self.dm_token).content)

    def test_returns_401_for_unauthenticated(self, client):
        """Test that an unauthenticated request returns 401."""
        assert self.get(client, self._url()).status_code == 401

    def test_returns_403_for_player(self, client):
        """Test that a non-DM player gets 403."""
        assert self.get(client, self._url(), token=self.player_token).status_code == 403

    def test_dm_gets_hidden_recipes_with_hidden_flag(self, client):
        """Test that a DM gets both visible and hidden recipes with their hidden flags."""
        by_name = {item['name']: item['hidden'] for item in self._data(client)}
        assert by_name == {'Brew Potion': False, 'Secret Brew': True}

    def test_superuser_gets_all_recipes(self, client):
        """Test that a superuser gets every recipe."""
        token = Token.objects.create(user=SuperUserFactory(username='admin'))
        response = self.get(client, self._url(), token=token)
        assert len(json.loads(response.content)) == 2

    def test_returns_real_hidden_output(self, client):
        """Test that a hidden output item is returned in full."""
        by_name = {item['name']: item for item in self._data(client)}
        assert by_name['Secret Brew']['output']['id'] == self.poison.id

    def test_category_filter_matches_hidden_output(self, client):
        """Test that the category filter uses the real category, even for hidden outputs."""
        assert [item['name'] for item in self._data(client, '?category=poison')] == [
            'Secret Brew',
        ]

    def test_unknown_category_returns_empty_list(self, client):
        """Test that an unknown category value returns an empty list."""
        assert self._data(client, '?category=unknown') == []

    def test_sets_skip_cache(self, client):
        """Test that the response sets X-Skip-Cache: true."""
        response = self.get(client, self._url(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'
