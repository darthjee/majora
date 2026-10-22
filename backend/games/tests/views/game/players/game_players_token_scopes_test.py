"""End-to-end tests for the `@token_scopes` declarations of the player views (issue #1630)."""

import pytest
from rest_framework.test import APIClient

from games.tests.factories import GameFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin


class PlayersScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM and a player, another game and an outsider."""

    def setup_method(self):
        """Set up the games, their members and an outsider."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player_row = self._member('player')
        self.player = self.player_row.user
        self.outsider = UserFactory(username='outsider', password='secret-password')

    def _list_url(self):
        """Return the players.json URL of the fixture game."""
        return '/games/test-game/players.json'

    def _detail_url(self):
        """Return the players/<id>.json URL of the fixture player."""
        return f'/games/test-game/players/{self.player_row.id}.json'


@pytest.mark.django_db
class TestPlayersTokenScopesReads(PlayersScopedTokenMixin):
    """Player reads need `players:read`."""

    def test_list_with_players_read_is_allowed(self):
        """Test that players.json with `players:read` answers 200."""
        assert self._get(self._list_url(), self.player, ['players:read']).status_code == 200

    def test_list_without_players_read_is_refused(self):
        """Test that players.json without `players:read` gives `scope_missing`."""
        self._assert_refused(self._get(self._list_url(), self.player, []), 'scope_missing')

    def test_detail_with_players_read_is_allowed(self):
        """Test that players/<id>.json with `players:read` answers 200."""
        assert self._get(self._detail_url(), self.player, ['players:read']).status_code == 200

    def test_detail_without_players_read_is_refused(self):
        """Test that players/<id>.json without `players:read` gives `scope_missing`."""
        self._assert_refused(self._get(self._detail_url(), self.player, []), 'scope_missing')


@pytest.mark.django_db
class TestPlayersTokenScopesGames(PlayersScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def test_list_on_another_game_is_refused(self):
        """Test that players.json with a token limited to another game is refused."""
        response = self._get(
            self._list_url(), self.player, ['players:read'], games=[self.other_game],
        )
        self._assert_refused(response, 'game_not_allowed')

    def test_detail_on_another_game_is_refused(self):
        """Test that players/<id>.json with a token limited to another game is refused."""
        response = self._get(
            self._detail_url(), self.player, ['players:read'], games=[self.other_game],
        )
        self._assert_refused(response, 'game_not_allowed')

    def test_list_on_the_game_is_allowed(self):
        """Test that players.json with a token limited to the game answers 200."""
        response = self._get(self._list_url(), self.player, ['players:read'], games=[self.game])
        assert response.status_code == 200


@pytest.mark.django_db
class TestPlayersTokenScopesOwnerIntersection(PlayersScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_outsider_list_is_refused_by_role(self):
        """Test that an outsider with `players:read` still gets a role 403 on players.json."""
        self._assert_role_refused(self._get(self._list_url(), self.outsider, ['players:read']))

    def test_outsider_detail_is_refused_by_role(self):
        """Test that an outsider with `players:read` still gets a role 403 on the detail."""
        self._assert_role_refused(self._get(self._detail_url(), self.outsider, ['players:read']))
