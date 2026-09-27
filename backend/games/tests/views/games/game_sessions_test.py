"""Tests for the game sessions list view (GET search / POST create)."""

import datetime
import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession
from games.tests.factories import GameFactory, PlayerFactory, SuperUserFactory, UserFactory


class TestGameSessionsCreateView(TestCase):
    """Tests for the POST /games/<slug>/sessions.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a superuser, a player of the game, a staff, and a regular user."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.regular_user = UserFactory(username='player', password='secret-password')
        cls.regular_token = Token.objects.create(user=cls.regular_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)

    def _post(self, client, payload, token=None, game_slug=None):
        """Issue a POST request to the game sessions list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/sessions.json'
        return client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_game_master_can_create_session(self):
        """Test that a DM of the game can create a session and receives 201."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.dm_token)
        assert response.status_code == 201

    def test_superuser_can_create_session(self):
        """Test that a superuser can create a session and receives 201."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.superuser_token)
        assert response.status_code == 201

    def test_player_of_game_can_create_session(self):
        """Test that any player of the game can create a session (issue #864)."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.player_token)
        assert response.status_code == 201

    def test_staff_can_create_session(self):
        """Test that a global Staff account can create a session (issue #864)."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.staff_token)
        assert response.status_code == 201

    def test_create_returns_session_detail(self):
        """Test that the response body contains id, title, date, and game_slug."""
        response = self._post(
            self.client, {'title': 'Session One', 'date': '2026-01-01'}, token=self.dm_token
        )
        data = json.loads(response.content)
        assert data['title'] == 'Session One'
        assert data['date'] == '2026-01-01'
        assert data['game_slug'] == 'test-game'
        assert 'id' in data

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post(self.client, {'title': 'Session One'})
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_non_game_master_post_returns_403(self):
        """Test that a POST from a non-DM, non-superuser returns 403."""
        response = self._post(self.client, {'title': 'Session One'}, token=self.regular_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_missing_title_returns_400(self):
        """Test that a POST without title returns 400."""
        response = self._post(self.client, {'date': '2026-01-01'}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'title' in data['errors']

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(
            self.client, {'title': 'Session One'}, token=self.dm_token, game_slug='unknown-game'
        )
        assert response.status_code == 404

    def test_created_session_persists_to_database(self):
        """Test that the created session is persisted and linked to the game."""
        self._post(self.client, {'title': 'Session One'}, token=self.dm_token)
        assert GameSession.objects.filter(game=self.game, title='Session One').exists()

    def test_create_with_description_persists_it(self):
        """Test that a description sent on creation is persisted and returned."""
        response = self._post(
            self.client, {'title': 'Session One', 'description': 'Some notes.'},
            token=self.dm_token,
        )
        data = json.loads(response.content)
        assert data['description'] == 'Some notes.'

    def test_url_by_name_accepts_post(self):
        """Test that the create endpoint is reachable via its URL name."""
        url = reverse('game-sessions-list', kwargs={'game_slug': 'test-game'})
        response = self._post(self.client, {'title': 'Session One'}, token=self.dm_token)
        assert url == '/games/test-game/sessions.json'
        assert response.status_code == 201


class TestGameSessionsSearchView(TestCase):
    """Tests for the GET /games/<slug>/sessions.json search endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game with dated and dateless sessions, plus another game's session."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.older = GameSession.objects.create(
            game=cls.game, title='The Crypt', date=datetime.date(2026, 1, 10),
        )
        cls.newer = GameSession.objects.create(
            game=cls.game, title='The Tower', date=datetime.date(2026, 5, 20),
        )
        cls.unscheduled = GameSession.objects.create(game=cls.game, title='Crypt Revisited')
        GameSession.objects.create(
            game=cls.other_game, title='Foreign Crypt', date=datetime.date(2026, 3, 1),
        )

    def _get(self, query='', game_slug='test-game'):
        """Issue an anonymous GET request to the game sessions search endpoint."""
        return self.client.get(f'/games/{game_slug}/sessions.json{query}')

    def _ids(self, query=''):
        """Return the ids of the sessions listed for `query`."""
        response = self._get(query)
        assert response.status_code == 200
        return [item['id'] for item in json.loads(response.content)]

    def test_anonymous_get_returns_200(self):
        """Test that the search endpoint is public."""
        assert self._get().status_code == 200

    def test_returns_only_game_sessions_most_recent_first(self):
        """Test that only the game's sessions are listed, dated ones newest first, then dateless."""
        assert self._ids() == [self.newer.id, self.older.id, self.unscheduled.id]

    def test_dateless_sessions_are_ordered_by_newest_id(self):
        """Test that dateless sessions are listed last, most recently created first."""
        latest = GameSession.objects.create(game=self.game, title='Later Unscheduled')
        assert self._ids()[-2:] == [latest.id, self.unscheduled.id]

    def test_name_filter_is_case_insensitive_substring_on_title(self):
        """Test that ?name= matches a case-insensitive substring of the title."""
        assert self._ids('?name=cRyPt') == [self.older.id, self.unscheduled.id]

    def test_blank_name_returns_every_session(self):
        """Test that a blank ?name= does not filter the list."""
        assert self._ids('?name=') == [self.newer.id, self.older.id, self.unscheduled.id]

    def test_per_page_caps_results(self):
        """Test that ?per_page= caps the number of returned sessions."""
        for index in range(6):
            GameSession.objects.create(game=self.game, title=f'Extra {index}')
        response = self._get('?per_page=5')
        assert len(json.loads(response.content)) == 5
        assert response['per_page'] == '5'

    def test_returns_picker_item_shape(self):
        """Test that each item exposes id, name, title and date."""
        data = json.loads(self._get('?name=tower').content)
        assert data == [{
            'id': self.newer.id,
            'name': 'The Tower',
            'title': 'The Tower',
            'date': '2026-05-20',
        }]

    def test_returns_404_for_unknown_game_slug(self):
        """Test that GET returns 404 for a non-existent game slug."""
        assert self._get(game_slug='unknown-game').status_code == 404
