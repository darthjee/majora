"""End-to-end tests for the `@token_scopes` declarations of the task views (issue #1634)."""

import pytest
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from games.models import GameSession, Task
from games.tests.factories import GameFactory
from games.tests.views.game._scoped_token_fixtures import ScopedTokenMixin

TASK_SCOPES = ['tasks:read', 'tasks:write']


class TaskScopedTokenMixin(ScopedTokenMixin):
    """Shared fixtures: a game with a DM and a player, a task and a session."""

    def setup_method(self):
        """Set up the game, its members, a task and a session."""
        self.client = APIClient()
        self.game = GameFactory(name='Test Game', game_slug='test-game')
        self.other_game = GameFactory(name='Other Game', game_slug='other-game')
        self.dm = self._member('dm', is_dm=True).user
        self.player = self._member('player').user
        self.task = Task.objects.create(game=self.game, short_description='Prep the ambush')
        self.session = GameSession.objects.create(game=self.game, title='Session One')

    def _task_url(self):
        """Return the fixture task's detail URL."""
        return f'/games/test-game/tasks/{self.task.id}.json'

    def _create(self, scopes, user=None):
        """POST a new task linked to the session as `user` (default: the DM) with `scopes`."""
        payload = {'short_description': 'Print minis', 'session': self.session.id}
        return self._post('/games/test-game/tasks.json', payload, user or self.dm, scopes)

    def _update(self, scopes, user=None):
        """PATCH the fixture task's session as `user` (default: the DM) with `scopes`."""
        payload = {'session': self.session.id}
        return self._patch(self._task_url(), payload, user or self.dm, scopes)


@pytest.mark.django_db
class TestTaskTokenScopesReads(TaskScopedTokenMixin):
    """Task reads need `tasks:read`."""

    def test_list_without_read_is_refused(self):
        """Test that tasks.json without `tasks:read` gives `scope_missing`."""
        response = self._get('/games/test-game/tasks.json', self.dm, ['tasks:write'])
        self._assert_refused(response, 'scope_missing')

    def test_list_with_read_is_allowed(self):
        """Test that tasks.json with `tasks:read` answers 200 for the DM."""
        response = self._get('/games/test-game/tasks.json', self.dm, ['tasks:read'])
        assert response.status_code == 200

    def test_detail_without_read_is_refused(self):
        """Test that tasks/<id>.json without `tasks:read` gives `scope_missing`."""
        self._assert_refused(self._get(self._task_url(), self.dm, ['tasks:write']), 'scope_missing')

    def test_detail_with_read_is_allowed(self):
        """Test that tasks/<id>.json with `tasks:read` answers 200 for the DM."""
        assert self._get(self._task_url(), self.dm, ['tasks:read']).status_code == 200


@pytest.mark.django_db
class TestTaskTokenScopesWrites(TaskScopedTokenMixin):
    """Task writes need `tasks:write` and no `sessions:*` scope, even when setting a session."""

    def test_create_without_write_is_refused(self):
        """Test that tasks.json POST with `tasks:read` alone gives `scope_missing`."""
        self._assert_refused(self._create(['tasks:read']), 'scope_missing')

    def test_create_with_write_succeeds(self):
        """Test that tasks.json POST with `tasks:write` alone answers 201."""
        assert self._create(['tasks:write']).status_code == 201

    def test_create_with_write_sets_session(self):
        """Test that tasks.json POST with `tasks:write` alone links the session."""
        response = self._create(['tasks:write'])
        assert response.json()['session']['id'] == self.session.id

    def test_update_without_write_is_refused(self):
        """Test that tasks/<id>.json PATCH with `tasks:read` alone gives `scope_missing`."""
        self._assert_refused(self._update(['tasks:read']), 'scope_missing')

    def test_update_with_write_succeeds(self):
        """Test that tasks/<id>.json PATCH with `tasks:write` alone answers 200."""
        assert self._update(['tasks:write']).status_code == 200

    def test_update_with_write_sets_session(self):
        """Test that tasks/<id>.json PATCH with `tasks:write` alone links the session."""
        self._update(['tasks:write'])
        self.task.refresh_from_db()
        assert self.task.session_id == self.session.id


@pytest.mark.django_db
class TestTaskTokenScopesGames(TaskScopedTokenMixin):
    """A token limited to some games is only accepted on those games."""

    def test_token_limited_to_another_game_is_refused(self):
        """Test that a token limited to another game gives `game_not_allowed`."""
        response = self._get(self._task_url(), self.dm, ['tasks:read'], games=[self.other_game])
        self._assert_refused(response, 'game_not_allowed')

    def test_token_limited_to_the_game_is_allowed(self):
        """Test that a token limited to the task's game answers 200."""
        response = self._get(self._task_url(), self.dm, ['tasks:read'], games=[self.game])
        assert response.status_code == 200


@pytest.mark.django_db
class TestTaskTokenScopesOwnerIntersection(TaskScopedTokenMixin):
    """A token never grants more than its owner's role allows."""

    def test_player_list_is_forbidden(self):
        """Test that a player with every task scope still gets a role 403 on tasks.json."""
        response = self._get('/games/test-game/tasks.json', self.player, TASK_SCOPES)
        self._assert_role_refused(response)

    def test_player_detail_is_forbidden(self):
        """Test that a player with every task scope still gets a role 403 on tasks/<id>.json."""
        self._assert_role_refused(self._get(self._task_url(), self.player, TASK_SCOPES))

    def test_player_create_is_forbidden(self):
        """Test that a player with every task scope still gets a role 403 on POST."""
        self._assert_role_refused(self._create(TASK_SCOPES, user=self.player))

    def test_player_update_is_forbidden(self):
        """Test that a player with every task scope still gets a role 403 on PATCH."""
        self._assert_role_refused(self._update(TASK_SCOPES, user=self.player))


@pytest.mark.django_db
class TestTaskTokenScopesOtherCredentials(TaskScopedTokenMixin):
    """Session and legacy `Token` requests are unaffected by scope declarations."""

    def test_session_dm_reads_task(self):
        """Test that the DM's session still reads tasks/<id>.json."""
        self._log_in(self.dm)
        assert self.client.get(self._task_url()).status_code == 200

    def test_legacy_token_player_is_forbidden(self):
        """Test that a player's legacy Token still gets 403 on tasks.json."""
        token = Token.objects.create(user=self.player)
        response = self.client.get(
            '/games/test-game/tasks.json', HTTP_AUTHORIZATION=f'Token {token.key}',
        )
        assert response.status_code == 403
