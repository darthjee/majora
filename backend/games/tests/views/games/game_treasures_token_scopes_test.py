"""End-to-end tests for the `@token_scopes` declarations of the game treasure views (#1636)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.tests.factories import (
    GameFactory,
    GameTreasureFactory,
    TreasureFactory,
    UserFactory,
)
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

READ = 'treasures:read'
WRITE = 'treasures:write'


class GameTreasureScopedTokenMixin(ScopedTokenMixin):
    """Fixtures: a game with a DM, a player and an outsider, plus visible and hidden treasures."""

    def setup_method(self):
        """Set up the game, its members, an outsider and the game's treasures."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        self.treasure = TreasureFactory(name='Visible Gem', game=self.game)
        self.hidden_treasure = TreasureFactory(name='Secret Idol', game=self.game)
        GameTreasureFactory(game=self.game, treasure=self.hidden_treasure, hidden=True)
        self.catalogue_treasure = TreasureFactory(name='Catalog', game_type=self.game.game_type)

    def _url(self, suffix):
        """Return the game's treasures URL followed by `suffix`."""
        return f'/games/test-game/treasures{suffix}'

    def _treasure_url(self, suffix='.json', treasure=None):
        """Return the URL of `treasure` (default: the visible one) followed by `suffix`."""
        treasure = treasure or self.treasure
        return self._url(f'/{treasure.id}{suffix}')

    def _hidden_full_url(self):
        """Return the full.json URL of the hidden treasure."""
        return self._treasure_url('/full.json', self.hidden_treasure)

    def _link_payload(self):
        """Return a payload linking the catalogue treasure to the game."""
        return {'treasure_id': self.catalogue_treasure.id, 'value': 100}


@pytest.mark.django_db
class TestGameTreasureTokenScopesPublicReads(GameTreasureScopedTokenMixin):
    """Plain game treasure reads accept a token without any scope."""

    def test_list_needs_no_scope(self):
        """Test that treasures.json answers 200 for a token with no scopes."""
        assert self._get(self._url('.json'), self.player, []).status_code == 200

    def test_detail_needs_no_scope(self):
        """Test that a visible treasure's detail answers 200 for a token with no scopes."""
        assert self._get(self._treasure_url(), self.player, []).status_code == 200


@pytest.mark.django_db
class TestGameTreasureTokenScopesRestrictedReads(GameTreasureScopedTokenMixin):
    """all.json, missing.json and <id>/full.json need `treasures:read`."""

    def test_all_without_read_is_refused(self):
        """Test that all.json without `treasures:read` gives `scope_missing`."""
        response = self._get(self._url('/all.json'), self.dm, [WRITE])
        self._assert_refused(response, 'scope_missing')

    def test_all_with_read_is_allowed(self):
        """Test that all.json with `treasures:read` answers 200 for the DM."""
        assert self._get(self._url('/all.json'), self.dm, [READ]).status_code == 200

    def test_missing_without_read_is_refused(self):
        """Test that missing.json without `treasures:read` gives `scope_missing`."""
        response = self._get(self._url('/missing.json'), self.dm, [WRITE])
        self._assert_refused(response, 'scope_missing')

    def test_missing_with_read_is_allowed(self):
        """Test that missing.json with `treasures:read` answers 200 for the DM."""
        assert self._get(self._url('/missing.json'), self.dm, [READ]).status_code == 200

    def test_full_without_read_is_refused(self):
        """Test that full.json without `treasures:read` gives `scope_missing`."""
        response = self._get(self._hidden_full_url(), self.dm, [WRITE])
        self._assert_refused(response, 'scope_missing')

    def test_full_with_read_is_allowed(self):
        """Test that full.json of a hidden treasure with `treasures:read` answers 200."""
        assert self._get(self._hidden_full_url(), self.dm, [READ]).status_code == 200


@pytest.mark.django_db
class TestGameTreasureTokenScopesWrites(GameTreasureScopedTokenMixin):
    """Creates, updates and links need `treasures:write`."""

    def _create(self, scopes):
        """POST a new treasure to the game as the DM with `scopes`."""
        return self._post(self._url('.json'), {'name': 'Gem', 'value': 100}, self.dm, scopes)

    def _update(self, scopes):
        """PATCH the visible treasure as the DM with `scopes`."""
        return self._patch(self._treasure_url(), {'name': 'Renamed'}, self.dm, scopes)

    def _link(self, scopes):
        """POST the catalogue treasure link as the DM with `scopes`."""
        return self._post(self._url('/link.json'), self._link_payload(), self.dm, scopes)

    def test_create_without_write_is_refused(self):
        """Test that a POST with `treasures:read` alone gives `scope_missing`."""
        self._assert_refused(self._create([READ]), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that a POST with `treasures:write` answers 201."""
        assert self._create([WRITE]).status_code == 201

    def test_update_without_write_is_refused(self):
        """Test that a PATCH with `treasures:read` alone gives `scope_missing`."""
        self._assert_refused(self._update([READ]), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that a PATCH with `treasures:write` answers 200."""
        assert self._update([WRITE]).status_code == 200

    def test_link_without_write_is_refused(self):
        """Test that link.json with `treasures:read` alone gives `scope_missing`."""
        self._assert_refused(self._link([READ]), 'scope_missing')

    def test_link_with_write_succeeds(self):
        """Test that link.json with `treasures:write` answers 201."""
        assert self._link([WRITE]).status_code == 201


@pytest.mark.django_db
class TestGameTreasureTokenScopesGames(GameTreasureScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def _all_with_games(self, games):
        """GET all.json as the DM with `treasures:read`, limited to `games`."""
        return self._get(self._url('/all.json'), self.dm, [READ], games=games)

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        self._assert_refused(self._all_with_games([self.other_game]), 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the treasure's game answers 200."""
        assert self._all_with_games([self.game]).status_code == 200


@pytest.mark.django_db
class TestGameTreasureTokenScopesOwnerIntersection(GameTreasureScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_player_all_is_forbidden(self):
        """Test that a player holding `treasures:read` still gets a role 403 on all.json."""
        response = self._get(self._url('/all.json'), self.player, [READ, WRITE])
        self._assert_role_refused(response)

    def test_player_missing_is_forbidden(self):
        """Test that a player holding `treasures:read` still gets a role 403 on missing.json."""
        response = self._get(self._url('/missing.json'), self.player, [READ, WRITE])
        self._assert_role_refused(response)

    def test_player_full_is_forbidden(self):
        """Test that a player holding `treasures:read` still gets a role 403 on full.json."""
        response = self._get(self._hidden_full_url(), self.player, [READ, WRITE])
        self._assert_role_refused(response)

    def test_player_create_is_forbidden(self):
        """Test that a player holding `treasures:write` still gets a role 403 on POST."""
        payload = {'name': 'Gem', 'value': 100}
        response = self._post(self._url('.json'), payload, self.player, [READ, WRITE])
        self._assert_role_refused(response)

    def test_player_link_is_forbidden(self):
        """Test that a player holding `treasures:write` still gets a role 403 on link.json."""
        payload = self._link_payload()
        response = self._post(self._url('/link.json'), payload, self.player, [READ, WRITE])
        self._assert_role_refused(response)

    def test_outsider_update_is_forbidden(self):
        """Test that a non-member holding every treasure scope still gets a role 403 on PATCH."""
        payload = {'name': 'Renamed'}
        response = self._patch(self._treasure_url(), payload, self.outsider, [READ, WRITE])
        self._assert_role_refused(response)


@pytest.mark.django_db
class TestGameTreasureTokenScopesOtherCredentials(GameTreasureScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_all(self):
        """Test that the DM's session still reads all.json."""
        self._log_in(self.dm)
        assert self.client.get(self._url('/all.json')).status_code == 200

    def test_legacy_token_dm_creates_treasure(self):
        """Test that the DM's legacy Token still creates a treasure."""
        token = Token.objects.create(user=self.dm)
        response = self.client.post(
            self._url('.json'), {'name': 'Gem', 'value': 100}, format='json',
            HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 201
