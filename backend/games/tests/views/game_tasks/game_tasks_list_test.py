"""Tests for the game tasks list view (GET list / POST create)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession, Task
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


class TestGameTasksListView(TestCase):
    """Tests for the GET /games/<slug>/tasks.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _get(self, client, token=None, game_slug=None, query=''):
        """Issue a GET request to the game tasks list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/tasks.json{query}'
        return client.get(url, **extra)

    def test_unauthenticated_get_returns_401(self):
        """Test that a GET without a token returns 401."""
        response = self._get(self.client)
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_get_returns_403(self):
        """Test that a GET from a non-DM, non-superuser returns 403."""
        response = self._get(self.client, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_game_master_returns_empty_list_when_no_tasks(self):
        """Test that an empty list is returned when the game has no tasks."""
        response = self._get(self.client, token=self.dm_token)
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_superuser_can_list(self):
        """Test that a superuser can list tasks and receives 200."""
        response = self._get(self.client, token=self.superuser_token)
        assert response.status_code == 200

    def test_returns_only_game_tasks(self):
        """Test that only tasks linked to the game are returned."""
        Task.objects.create(game=self.game, short_description='Prep the ambush')
        Task.objects.create(game=self.other_game, short_description='Other task')
        response = self._get(self.client, token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['short_description'] == 'Prep the ambush'

    def test_returns_expected_fields(self):
        """Test that list items include id, short_description, long_description, completed,
        session."""
        session = GameSession.objects.create(game=self.game, title='Session One')
        task = Task.objects.create(
            game=self.game,
            short_description='Prep the ambush',
            long_description='Some notes',
            completed=True,
            session=session,
        )
        response = self._get(self.client, token=self.dm_token)
        data = json.loads(response.content)
        assert data[0]['id'] == task.id
        assert data[0]['short_description'] == 'Prep the ambush'
        assert data[0]['long_description'] == 'Some notes'
        assert data[0]['completed'] is True
        assert data[0]['session'] == session.id
        assert data[0]['category'] == 'other'

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(self.client, token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self._get(self.client, token=self.dm_token)
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self._get(self.client, token=self.dm_token)
        assert response['pages'] == '1'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            Task.objects.create(game=self.game, short_description=f'Task {i}')
        response = self._get(self.client, token=self.dm_token, query='?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_respects_page_param(self):
        """Test that ?page=N returns the correct page of results."""
        for i in range(5):
            Task.objects.create(game=self.game, short_description=f'Task {i}')
        response = self._get(self.client, token=self.dm_token, query='?page=2&per_page=3')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-tasks-list', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200

    def test_get_returns_skip_cache_header(self):
        """Test that the GET response includes the X-Skip-Cache: true header."""
        response = self._get(self.client, token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_forbidden_get_returns_skip_cache_header(self):
        """Test that a permission-denied GET still includes the X-Skip-Cache: true header."""
        response = self._get(self.client, token=self.regular_token)
        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'

    def test_list_is_ordered_by_creation(self):
        """Test that the list is ordered by id (creation order)."""
        first = Task.objects.create(game=self.game, short_description='First')
        second = Task.objects.create(game=self.game, short_description='Second')
        response = self._get(self.client, token=self.dm_token)
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


class TestGameTasksListFiltersView(TestCase):
    """Tests for the `category` / `completed` filters on GET /games/<slug>/tasks.json."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game with tasks across categories and completion states."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.painting_done = Task.objects.create(
            game=cls.game, short_description='Paint done', category='painting', completed=True,
        )
        cls.painting_pending = Task.objects.create(
            game=cls.game, short_description='Paint pending', category='painting',
        )
        cls.printing_done = Task.objects.create(
            game=cls.game, short_description='Print done', category='printing', completed=True,
        )
        cls.other_pending = Task.objects.create(game=cls.game, short_description='Other pending')
        Task.objects.create(
            game=cls.other_game, short_description='Foreign paint', category='painting',
        )

    def _get(self, query=''):
        """Issue an authenticated GET request to the game tasks list endpoint."""
        return self.client.get(
            f'/games/{self.game.game_slug}/tasks.json{query}',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )

    def _ids(self, query=''):
        """Return the ids of the tasks listed for `query`."""
        response = self._get(query)
        assert response.status_code == 200
        return [item['id'] for item in json.loads(response.content)]

    def _all_ids(self):
        """Return the ids of every task of the game, in list order."""
        return [
            self.painting_done.id, self.painting_pending.id,
            self.printing_done.id, self.other_pending.id,
        ]

    def test_no_params_returns_every_task(self):
        """Test that without filters every task of the game is returned."""
        assert self._ids() == self._all_ids()

    def test_category_filter_narrows_results(self):
        """Test that ?category= returns only tasks of that category."""
        assert self._ids('?category=painting') == [
            self.painting_done.id, self.painting_pending.id,
        ]

    def test_completed_true_filter_narrows_results(self):
        """Test that ?completed=true returns only completed tasks."""
        assert self._ids('?completed=true') == [self.painting_done.id, self.printing_done.id]

    def test_completed_false_filter_narrows_results(self):
        """Test that ?completed=false returns only pending tasks."""
        assert self._ids('?completed=false') == [
            self.painting_pending.id, self.other_pending.id,
        ]

    def test_completed_filter_is_case_insensitive(self):
        """Test that ?completed=True is treated like ?completed=true."""
        assert self._ids('?completed=True') == [self.painting_done.id, self.printing_done.id]

    def test_category_and_completed_are_combined(self):
        """Test that category and completed filters are combined with AND."""
        assert self._ids('?category=painting&completed=false') == [self.painting_pending.id]

    def test_unknown_category_is_ignored(self):
        """Test that an unknown category returns the unfiltered list."""
        assert self._ids('?category=cooking') == self._all_ids()

    def test_category_filter_is_case_sensitive(self):
        """Test that a category differing only in case is ignored."""
        assert self._ids('?category=Painting') == self._all_ids()

    def test_unknown_completed_is_ignored(self):
        """Test that an unknown completed value returns the unfiltered list."""
        assert self._ids('?completed=maybe') == self._all_ids()

    def test_filters_do_not_leak_other_game_tasks(self):
        """Test that filtering never returns tasks from another game."""
        foreign = Task.objects.get(short_description='Foreign paint')
        assert foreign.id not in self._ids('?category=painting&completed=false')

    def test_pagination_reflects_filtered_count(self):
        """Test that the pages header is computed over the filtered queryset."""
        response = self._get('?category=painting&per_page=1')
        assert response['pages'] == '2'
        assert len(json.loads(response.content)) == 1


class TestGameTasksCreateView(TestCase):
    """Tests for the POST /games/<slug>/tasks.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a superuser, and a regular user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game tasks list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/tasks.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_create_task(self):
        """Test that a DM of the game can create a task and receives 201."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.dm_token
        )
        assert response.status_code == 201

    def test_superuser_can_create_task(self):
        """Test that a superuser can create a task and receives 201."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.superuser_token
        )
        assert response.status_code == 201

    def test_create_returns_task_detail(self):
        """Test that the response body contains the full task item shape."""
        response = self._post(
            self.client,
            {
                'short_description': 'Prep the ambush',
                'long_description': 'Some notes',
                'completed': True,
            },
            token=self.dm_token,
        )
        data = json.loads(response.content)
        assert data['short_description'] == 'Prep the ambush'
        assert data['long_description'] == 'Some notes'
        assert data['completed'] is True
        assert data['session'] is None
        assert 'id' in data

    def test_create_without_category_defaults_to_other(self):
        """Test that a POST without category creates the task as `other`."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.dm_token
        )
        assert json.loads(response.content)['category'] == 'other'
        assert Task.objects.get(short_description='Prep the ambush').category == 'other'

    def test_create_with_category_saves_it(self):
        """Test that a POST with a valid category saves and returns it."""
        response = self._post(
            self.client,
            {'short_description': 'Prep the ambush', 'category': 'printing'},
            token=self.dm_token,
        )
        assert response.status_code == 201
        assert json.loads(response.content)['category'] == 'printing'
        assert Task.objects.get(short_description='Prep the ambush').category == 'printing'

    def test_create_with_invalid_category_returns_400(self):
        """Test that a POST with an unknown category returns 400 with invalid_choice."""
        response = self._post(
            self.client,
            {'short_description': 'Prep the ambush', 'category': 'cooking'},
            token=self.dm_token,
        )
        assert response.status_code == 400
        assert json.loads(response.content)['errors']['category'] == ['invalid_choice']

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post(self.client, {'short_description': 'Prep the ambush'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.regular_token
        )
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_post_returns_skip_cache_header(self):
        """Test that the POST response includes the X-Skip-Cache: true header."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.dm_token
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_forbidden_post_returns_skip_cache_header(self):
        """Test that a permission-denied POST still includes the X-Skip-Cache: true header."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.regular_token
        )
        assert response.status_code == 403
        assert response['X-Skip-Cache'] == 'true'

    def test_missing_short_description_returns_400(self):
        """Test that a POST without short_description returns 400."""
        response = self._post(self.client, {'long_description': 'Some notes'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'short_description' in data['errors']

    def test_session_from_different_game_returns_400(self):
        """Test that a session belonging to a different game is rejected with 400."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        other_session = GameSession.objects.create(game=other_game, title='Other Session')
        response = self._post(
            self.client,
            {'short_description': 'Prep the ambush', 'session': other_session.id},
            token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'session' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            self.client, {'short_description': 'Prep the ambush'}, token=self.dm_token,
            game_slug='unknown-game',
        )
        assert response.status_code == 404

    def test_created_task_persists_to_database(self):
        """Test that the created task is persisted and linked to the game."""
        self._post(self.client, {'short_description': 'Prep the ambush'}, token=self.dm_token)
        assert Task.objects.filter(game=self.game, short_description='Prep the ambush').exists()

    def test_game_field_in_payload_is_ignored(self):
        """Test that a game field in the payload is ignored — task is always under the URL's
        game."""
        other_game = GameFactory(name='Other Game', game_slug='other-game')
        response = self._post(
            self.client,
            {'short_description': 'Prep the ambush', 'game': other_game.id},
            token=self.dm_token,
        )
        assert response.status_code == 201
        task = Task.objects.get(short_description='Prep the ambush')
        assert task.game == self.game
