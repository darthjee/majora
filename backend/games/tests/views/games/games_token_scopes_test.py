"""End-to-end tests for the `@token_scopes` declarations of the games views (issue #1630)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from domains.tests.factories import DomainFactory
from games.tests.factories import GameFactory, PlayerFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin
from majora_project.cache import memory_cache

MY_GAMES_URL = '/my-games.json'


class GamesScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: two games on a domain, members of the first one, and an outsider."""

    def setup_method(self):
        """Set up the domain, the games, their members and an outsider."""
        memory_cache.clear()
        self.client = APIClient()
        self.domain = DomainFactory(domain='testserver')
        self.game = self._game('Test Game', 'test-game')
        self.other_game = self._game('Other Game', 'other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        PlayerFactory(name='dm', game=self.other_game, user=self.dm, is_dm=True)

    def _game(self, name, slug):
        """Return a new game attached to the registered domain."""
        return GameFactory(name=name, game_slug=slug, game_domain_groups=[self.domain.domain_group])

    def _slugs(self, response):
        """Return the set of game slugs listed in a my-games response."""
        return {item['game']['game_slug'] for item in response.json()}


@pytest.mark.django_db
class TestGamesTokenScopesPublicReads(GamesScopedTokenMixin):
    """Plain game reads accept a token without any scope."""

    def test_games_list_needs_no_scope(self):
        """Test that games.json answers 200 for a token with no scopes."""
        assert self._get('/games.json', self.player, []).status_code == 200

    def test_game_detail_needs_no_scope(self):
        """Test that games/<slug>.json answers 200 for a token with no scopes."""
        assert self._get('/games/test-game.json', self.player, []).status_code == 200

    def test_game_access_needs_no_scope(self):
        """Test that games/<slug>/access.json answers 200 for a token with no scopes."""
        assert self._get('/games/test-game/access.json', self.player, []).status_code == 200

    def test_game_permissions_needs_no_scope(self):
        """Test that permissions/game.json answers 200 for a token with no scopes."""
        assert self._get('/permissions/game.json', self.player, []).status_code == 200


@pytest.mark.django_db
class TestGamesTokenScopesWrites(GamesScopedTokenMixin):
    """Game creation and update need `games:write`."""

    def _create(self, scopes):
        """POST a new game to games.json as the player with `scopes`."""
        return self._post('/games.json', {'name': 'New Adventure'}, self.player, scopes)

    def _update(self, scopes, user=None, games=None):
        """PATCH the fixture game as `user` (default: the DM) with `scopes`."""
        headers = self._bearer(user or self.dm, scopes, games)
        return self.client.patch(
            '/games/test-game.json', {'name': 'Renamed'}, format='json', **headers,
        )

    def test_create_without_write_is_refused(self):
        """Test that games.json POST with `games:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(['games:read']), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that games.json POST with `games:write` answers 201."""
        assert self._create(['games:write']).status_code == 201

    def test_update_without_write_is_refused(self):
        """Test that games/<slug>.json PATCH with `games:read` alone gives `scope_missing`."""
        self._assert_refused(self._update(['games:read']), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that games/<slug>.json PATCH with `games:write` answers 200."""
        assert self._update(['games:write']).status_code == 200

    def test_update_on_another_game_is_refused(self):
        """Test that a PATCH with a token limited to another game gives `game_not_allowed`."""
        response = self._update(['games:write'], games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_outsider_update_is_refused_by_role(self):
        """Test that a non-member with `games:write` still gets a role 403 on PATCH."""
        self._assert_role_refused(self._update(['games:write'], user=self.outsider))

    def test_player_update_is_allowed(self):
        """Test that a player, whose role has the regular edit tier, can PATCH with the scope."""
        assert self._update(['games:write'], user=self.player).status_code == 200


@pytest.mark.django_db
class TestMyGamesTokenScopes(GamesScopedTokenMixin):
    """my-games.json needs `games:read` and is filtered by the token's game list."""

    def test_without_games_read_is_refused(self):
        """Test that my-games.json without `games:read` gives `scope_missing`."""
        self._assert_refused(self._get(MY_GAMES_URL, self.dm, []), 'scope_missing')

    def test_empty_game_list_lists_every_game(self):
        """Test that a token with no game list sees every one of the owner's games."""
        response = self._get(MY_GAMES_URL, self.dm, ['games:read'])
        assert self._slugs(response) == {'test-game', 'other-game'}

    def test_one_game_list_lists_only_that_game(self):
        """Test that a token limited to one game only sees that game."""
        response = self._get(MY_GAMES_URL, self.dm, ['games:read'], games=[self.game])
        assert self._slugs(response) == {'test-game'}


@pytest.mark.django_db
class TestGamesTokenScopesOtherCredentials(GamesScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_lists_every_game(self):
        """Test that the DM's session still sees every game on my-games.json."""
        self._log_in(self.dm)
        assert self._slugs(self.client.get(MY_GAMES_URL)) == {'test-game', 'other-game'}

    def test_legacy_token_lists_every_game(self):
        """Test that the DM's legacy Token still sees every game on my-games.json."""
        token = Token.objects.create(user=self.dm)
        response = self.client.get(MY_GAMES_URL, HTTP_AUTHORIZATION=f'Token {token.key}')
        assert self._slugs(response) == {'test-game', 'other-game'}

    def test_legacy_token_updates_game(self):
        """Test that the DM's legacy Token still updates the game."""
        token = Token.objects.create(user=self.dm)
        response = self.client.patch(
            '/games/test-game.json', {'name': 'Renamed'}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 200
