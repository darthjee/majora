"""End-to-end tests for the `@token_scopes` declarations of the session views (issue #1637)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import GameSession
from games.tests.factories import GameFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

SESSION_SCOPES = ['sessions:read', 'sessions:write']


class SessionScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM and a player, a non-member and a session."""

    def setup_method(self):
        """Set up the game, its members, a non-member and a session."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        self.session = GameSession.objects.create(game=self.game, title='Session One')

    def _session_url(self):
        """Return the fixture session's detail URL."""
        return f'/games/test-game/sessions/{self.session.id}.json'

    def _messages_url(self):
        """Return the fixture session's messages URL."""
        return f'/games/test-game/sessions/{self.session.id}/messages.json'

    def _create(self, scopes, user=None):
        """POST a new session as `user` (default: the DM) with `scopes`."""
        payload = {'title': 'Session Two'}
        return self._post('/games/test-game/sessions.json', payload, user or self.dm, scopes)

    def _update(self, scopes, user=None):
        """PATCH the fixture session's title as `user` (default: the DM) with `scopes`."""
        return self._patch(self._session_url(), {'title': 'Renamed'}, user or self.dm, scopes)

    def _post_message(self, scopes, user=None):
        """POST a message to the fixture session as `user` (default: the player)."""
        payload = {'content': 'Hello there'}
        return self._post(self._messages_url(), payload, user or self.player, scopes)


@pytest.mark.django_db
class TestSessionTokenScopesPublicReads(SessionScopedTokenMixin):
    """Public session reads need no scope at all."""

    def test_list_without_scopes_is_allowed(self):
        """Test that sessions.json answers 200 to a token with no scopes."""
        assert self._get('/games/test-game/sessions.json', self.dm, []).status_code == 200

    def test_past_without_scopes_is_allowed(self):
        """Test that sessions/past.json answers 200 to a token with no scopes."""
        assert self._get('/games/test-game/sessions/past.json', self.dm, []).status_code == 200

    def test_future_without_scopes_is_allowed(self):
        """Test that sessions/future.json answers 200 to a token with no scopes."""
        assert self._get('/games/test-game/sessions/future.json', self.dm, []).status_code == 200

    def test_unscheduled_without_scopes_is_allowed(self):
        """Test that sessions/unscheduled.json answers 200 to a token with no scopes."""
        url = '/games/test-game/sessions/unscheduled.json'
        assert self._get(url, self.dm, []).status_code == 200

    def test_detail_without_scopes_is_allowed(self):
        """Test that sessions/<id>.json answers 200 to a token with no scopes."""
        assert self._get(self._session_url(), self.dm, []).status_code == 200


@pytest.mark.django_db
class TestSessionTokenScopesMessages(SessionScopedTokenMixin):
    """Session messages need `sessions:read` to list and `sessions:write` to post."""

    def test_list_without_read_is_refused(self):
        """Test that messages.json GET without `sessions:read` gives `scope_missing`."""
        response = self._get(self._messages_url(), self.player, ['sessions:write'])
        self._assert_refused(response, 'scope_missing')

    def test_list_with_read_is_allowed(self):
        """Test that messages.json GET with `sessions:read` answers 200 for the player."""
        assert self._get(self._messages_url(), self.player, ['sessions:read']).status_code == 200

    def test_list_keeps_skip_cache_header(self):
        """Test that messages.json GET with a scoped token still sets `X-Skip-Cache`."""
        response = self._get(self._messages_url(), self.player, ['sessions:read'])
        assert response['X-Skip-Cache'] == 'true'

    def test_post_without_write_is_refused(self):
        """Test that messages.json POST with `sessions:read` alone gives `scope_missing`."""
        self._assert_refused(self._post_message(['sessions:read']), 'scope_missing')

    def test_post_with_write_succeeds(self):
        """Test that messages.json POST with `sessions:write` alone answers 201."""
        assert self._post_message(['sessions:write']).status_code == 201


@pytest.mark.django_db
class TestSessionTokenScopesWrites(SessionScopedTokenMixin):
    """Session create and update need `sessions:write`."""

    def test_create_without_write_is_refused(self):
        """Test that sessions.json POST with `sessions:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(['sessions:read']), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that sessions.json POST with `sessions:write` alone answers 201."""
        assert self._create(['sessions:write']).status_code == 201

    def test_update_without_write_is_refused(self):
        """Test that sessions/<id>.json PATCH with `sessions:read` alone gives `scope_missing`."""
        self._assert_refused(self._update(['sessions:read']), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that sessions/<id>.json PATCH with `sessions:write` alone answers 200."""
        assert self._update(['sessions:write']).status_code == 200

    def test_update_with_write_persists(self):
        """Test that sessions/<id>.json PATCH with `sessions:write` renames the session."""
        self._update(['sessions:write'])
        self.session.refresh_from_db()
        assert self.session.title == 'Renamed'


@pytest.mark.django_db
class TestSessionTokenScopesGames(SessionScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(
            self._messages_url(), self.player, ['sessions:read'], games=[self.other_game],
        )
        self._assert_refused(response, 'game_not_allowed')

    def test_public_read_limited_to_another_game_is_refused(self):
        """Test that a public read with a token limited to another game is refused."""
        response = self._get(self._session_url(), self.dm, [], games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the session's game answers 200."""
        response = self._get(
            self._messages_url(), self.player, ['sessions:read'], games=[self.game],
        )
        assert response.status_code == 200


@pytest.mark.django_db
class TestSessionTokenScopesOwnerIntersection(SessionScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_outsider_messages_list_is_forbidden(self):
        """Test that a non-member with every session scope gets a role 403 on messages GET."""
        response = self._get(self._messages_url(), self.outsider, SESSION_SCOPES)
        self._assert_role_refused(response)

    def test_outsider_messages_post_is_forbidden(self):
        """Test that a non-member with every session scope gets a role 403 on messages POST."""
        self._assert_role_refused(self._post_message(SESSION_SCOPES, user=self.outsider))

    def test_outsider_create_is_forbidden(self):
        """Test that a non-member with every session scope gets a role 403 on sessions POST."""
        self._assert_role_refused(self._create(SESSION_SCOPES, user=self.outsider))

    def test_outsider_update_is_forbidden(self):
        """Test that a non-member with every session scope gets a role 403 on PATCH."""
        self._assert_role_refused(self._update(SESSION_SCOPES, user=self.outsider))


@pytest.mark.django_db
class TestSessionTokenScopesOtherCredentials(SessionScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_player_lists_messages(self):
        """Test that the player's session still lists messages.json."""
        self._log_in(self.player)
        assert self.client.get(self._messages_url()).status_code == 200

    def test_legacy_token_outsider_is_forbidden(self):
        """Test that a non-member's legacy Token still gets 403 on messages.json."""
        token = Token.objects.create(user=self.outsider)
        response = self.client.get(
            self._messages_url(), HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 403
