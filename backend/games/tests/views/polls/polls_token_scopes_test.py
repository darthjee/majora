"""End-to-end tests for the `@token_scopes` declarations of the poll views (issue #1637)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import GameSession, Poll
from games.tests.factories import GameFactory, PollFactory, PollOptionFactory, UserFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

POLL_SCOPES = ['polls:read', 'polls:write']


class PollScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM and a player, outsiders, a session and an open poll."""

    def setup_method(self):
        """Set up the game, its members, a non-member, a staff user, a session and a poll."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.outsider = UserFactory(username='outsider', password='secret-password')
        self.staff = UserFactory(username='staff', password='secret-password', is_staff=True)
        self.session = GameSession.objects.create(game=self.game, title='Session One')
        self.poll = PollFactory(game=self.game, type=Poll.TYPE_SINGLE, status=Poll.STATUS_OPEN)
        self.option = PollOptionFactory(poll=self.poll, option='The Drunken Griffin')

    def _poll_url(self, suffix=''):
        """Return the fixture poll's URL, with an optional `suffix` (e.g. `/votes`)."""
        return f'/games/test-game/polls/{self.poll.id}{suffix}.json'

    def _create(self, scopes, user=None):
        """POST a new poll as `user` (default: the DM) with `scopes`."""
        payload = {
            'title': 'Which tavern?',
            'type': Poll.TYPE_SINGLE,
            'options': [{'option': 'The Drunken Griffin'}, {'option': 'The Rusty Anchor'}],
        }
        return self._post('/games/test-game/polls.json', payload, user or self.dm, scopes)

    def _create_session_poll(self, scopes, user=None):
        """POST a date poll for the fixture session as `user` (default: the DM)."""
        url = f'/games/test-game/sessions/{self.session.id}/poll.json'
        payload = {'dates': ['2026-08-01', '2026-08-08']}
        return self._post(url, payload, user or self.dm, scopes)

    def _vote(self, scopes, user=None):
        """PUT a vote for the fixture option as `user` (default: the player)."""
        payload = {'option_ids': [self.option.id]}
        return self._put(self._poll_url('/votes'), payload, user or self.player, scopes)

    def _close(self, scopes, user=None):
        """PATCH the fixture poll closed as `user` (default: the DM)."""
        return self._patch(self._poll_url('/close'), {}, user or self.dm, scopes)


@pytest.mark.django_db
class TestPollTokenScopesReads(PollScopedTokenMixin):
    """Poll reads need `polls:read`."""

    def test_list_without_read_is_refused(self):
        """Test that polls.json without `polls:read` gives `scope_missing`."""
        response = self._get('/games/test-game/polls.json', self.dm, ['polls:write'])
        self._assert_refused(response, 'scope_missing')

    def test_list_with_read_is_allowed(self):
        """Test that polls.json with `polls:read` answers 200 for the DM."""
        assert self._get('/games/test-game/polls.json', self.dm, ['polls:read']).status_code == 200

    def test_list_keeps_skip_cache_header(self):
        """Test that polls.json with a scoped token still sets `X-Skip-Cache`."""
        response = self._get('/games/test-game/polls.json', self.dm, ['polls:read'])
        assert response['X-Skip-Cache'] == 'true'

    def test_detail_without_read_is_refused(self):
        """Test that polls/<id>.json without `polls:read` gives `scope_missing`."""
        self._assert_refused(self._get(self._poll_url(), self.dm, ['polls:write']), 'scope_missing')

    def test_detail_with_read_is_allowed(self):
        """Test that polls/<id>.json with `polls:read` answers 200 for the DM."""
        assert self._get(self._poll_url(), self.dm, ['polls:read']).status_code == 200

    def test_votes_without_read_is_refused(self):
        """Test that polls/<id>/votes.json GET without `polls:read` gives `scope_missing`."""
        response = self._get(self._poll_url('/votes'), self.dm, ['polls:write'])
        self._assert_refused(response, 'scope_missing')

    def test_votes_with_read_is_allowed(self):
        """Test that polls/<id>/votes.json GET with `polls:read` answers 200 for the DM."""
        assert self._get(self._poll_url('/votes'), self.dm, ['polls:read']).status_code == 200


@pytest.mark.django_db
class TestPollTokenScopesWrites(PollScopedTokenMixin):
    """Poll writes need `polls:write` and no `sessions:*` scope."""

    def test_create_without_write_is_refused(self):
        """Test that polls.json POST with `polls:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(['polls:read']), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that polls.json POST with `polls:write` alone answers 201."""
        assert self._create(['polls:write']).status_code == 201

    def test_session_poll_without_write_is_refused(self):
        """Test that sessions/<id>/poll.json POST with `polls:read` alone gives `scope_missing`."""
        self._assert_refused(self._create_session_poll(['polls:read']), 'scope_missing')

    def test_session_poll_with_sessions_scopes_is_refused(self):
        """Test that sessions/<id>/poll.json POST with only `sessions:*` gives `scope_missing`."""
        response = self._create_session_poll(['sessions:read', 'sessions:write'])
        self._assert_refused(response, 'scope_missing')

    def test_session_poll_with_write_succeeds(self):
        """Test that sessions/<id>/poll.json POST with `polls:write` alone answers 201."""
        assert self._create_session_poll(['polls:write']).status_code == 201

    def test_vote_without_write_is_refused(self):
        """Test that polls/<id>/votes.json PUT with `polls:read` alone gives `scope_missing`."""
        self._assert_refused(self._vote(['polls:read']), 'scope_missing')

    def test_vote_with_write_succeeds(self):
        """Test that polls/<id>/votes.json PUT with `polls:write` alone answers 200."""
        assert self._vote(['polls:write']).status_code == 200

    def test_close_without_write_is_refused(self):
        """Test that polls/<id>/close.json PATCH with `polls:read` alone gives `scope_missing`."""
        self._assert_refused(self._close(['polls:read']), 'scope_missing')

    def test_close_with_write_succeeds(self):
        """Test that polls/<id>/close.json PATCH with `polls:write` alone answers 200."""
        assert self._close(['polls:write']).status_code == 200

    def test_close_with_write_closes_the_poll(self):
        """Test that polls/<id>/close.json PATCH with `polls:write` closes the poll."""
        self._close(['polls:write'])
        self.poll.refresh_from_db()
        assert self.poll.status != Poll.STATUS_OPEN


@pytest.mark.django_db
class TestPollTokenScopesGames(PollScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(self._poll_url(), self.dm, ['polls:read'], games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the poll's game answers 200."""
        response = self._get(self._poll_url(), self.dm, ['polls:read'], games=[self.game])
        assert response.status_code == 200


@pytest.mark.django_db
class TestPollTokenScopesOwnerIntersection(PollScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_outsider_list_is_forbidden(self):
        """Test that a non-member with every poll scope gets a role 403 on polls.json."""
        response = self._get('/games/test-game/polls.json', self.outsider, POLL_SCOPES)
        self._assert_role_refused(response)

    def test_player_close_is_forbidden(self):
        """Test that a player with `polls:write` gets a role 403 on close."""
        self._assert_role_refused(self._close(['polls:write'], user=self.player))

    def test_staff_vote_is_forbidden(self):
        """Test that a staff non-member with `polls:write` gets a role 403 on votes PUT."""
        self._assert_role_refused(self._vote(['polls:write'], user=self.staff))


@pytest.mark.django_db
class TestPollTokenScopesOtherCredentials(PollScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_poll(self):
        """Test that the DM's session still reads polls/<id>.json."""
        self._log_in(self.dm)
        assert self.client.get(self._poll_url()).status_code == 200

    def test_legacy_token_player_close_is_forbidden(self):
        """Test that a player's legacy Token still gets 403 on close."""
        token = Token.objects.create(user=self.player)
        response = self.client.patch(
            self._poll_url('/close'), {}, format='json', HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 403
