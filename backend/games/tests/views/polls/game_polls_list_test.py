"""Tests for the game polls list view (GET list / POST create)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Poll
from games.serializers.games.polls.poll_create import MAX_OPTIONS
from games.tests.factories import (
    GameFactory,
    PlayerFactory,
    PollFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGamePollsListView(TestCase):
    """Tests for the GET /games/<slug>/polls.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player, a superuser, a staff user, and an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _get(self, token=None, game_slug=None, query=''):
        """Issue a GET request to the game polls list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/polls.json{query}'
        return self.client.get(url, **extra)

    def test_unauthenticated_get_returns_401(self):
        """Test that a GET without a token returns 401."""
        response = self._get()
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_get_returns_403(self):
        """Test that a GET from a user unrelated to the game returns 403."""
        response = self._get(token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_dm_can_list(self):
        """Test that the DM of the game can list polls."""
        response = self._get(token=self.dm_token)
        assert response.status_code == 200

    def test_player_can_list(self):
        """Test that a player of the game can list polls."""
        response = self._get(token=self.player_token)
        assert response.status_code == 200

    def test_superuser_can_list(self):
        """Test that a superuser can list polls."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 200

    def test_staff_can_list(self):
        """Test that a staff user can list polls."""
        response = self._get(token=self.staff_token)
        assert response.status_code == 200

    def test_returns_empty_list_when_no_polls(self):
        """Test that an empty list is returned when the game has no polls."""
        response = self._get(token=self.dm_token)
        assert json.loads(response.content) == []

    def test_returns_only_game_polls(self):
        """Test that only polls linked to the game are returned."""
        poll = PollFactory(game=self.game, title='Which tavern?')
        PollFactory(game=self.other_game, title='Other poll')
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == poll.id

    def test_returns_expected_fields(self):
        """Test that list items include id, title, type, status only."""
        PollFactory(
            game=self.game, title='Which tavern?', type=Poll.TYPE_MULTIPLE,
            status=Poll.STATUS_OPEN,
        )
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert set(data[0].keys()) == {'id', 'title', 'type', 'status'}
        assert data[0]['title'] == 'Which tavern?'
        assert data[0]['type'] == Poll.TYPE_MULTIPLE
        assert data[0]['status'] == Poll.STATUS_OPEN

    def test_status_filter_narrows_results(self):
        """Test that ?status= filters the returned polls."""
        open_poll = PollFactory(game=self.game, status=Poll.STATUS_OPEN)
        PollFactory(game=self.game, status=Poll.STATUS_CLOSED)
        response = self._get(token=self.dm_token, query='?status=open')
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['id'] == open_poll.id

    def test_status_filter_with_unknown_value_returns_empty_list(self):
        """Test that an unrecognized status value yields an empty page, not a 400."""
        PollFactory(game=self.game, status=Poll.STATUS_OPEN)
        response = self._get(token=self.dm_token, query='?status=unknown')
        assert response.status_code == 200
        assert json.loads(response.content) == []

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_response_includes_page_header(self):
        """Test that the response includes the page header."""
        response = self._get(token=self.dm_token)
        assert response['page'] == '1'

    def test_response_includes_pages_header(self):
        """Test that the response includes the total pages header."""
        response = self._get(token=self.dm_token)
        assert response['pages'] == '1'

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._get(token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_respects_per_page_param(self):
        """Test that ?per_page=N limits the number of results returned."""
        for i in range(5):
            PollFactory(game=self.game, title=f'Poll {i}')
        response = self._get(token=self.dm_token, query='?per_page=2')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 2

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse('game-polls-list', kwargs={'game_slug': 'test-game'})
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200

    def test_list_is_ordered_by_creation(self):
        """Test that the list is ordered by id (creation order)."""
        first = PollFactory(game=self.game, title='First')
        second = PollFactory(game=self.game, title='Second')
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert [item['id'] for item in data] == [first.id, second.id]


class TestGamePollsCreateView(TestCase):
    """Tests for the POST /games/<slug>/polls.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a DM, a player, a superuser, a staff user, and an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _payload(self, **overrides):
        """Build a valid poll creation payload, honoring any given overrides."""
        payload = {
            'title': 'Which tavern?',
            'description': 'Pick one for tonight.',
            'type': Poll.TYPE_SINGLE,
            'options': [{'option': 'The Drunken Griffin'}, {'option': 'The Rusty Anchor'}],
        }
        payload.update(overrides)
        return payload

    def _post(self, payload, token=None, game_slug=None):
        """Issue a POST request to the game polls list endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        url = f'/games/{game_slug or self.game.game_slug}/polls.json'
        return self.client.post(
            url, data=json.dumps(payload), content_type='application/json', **extra,
        )

    def test_unauthenticated_post_returns_401(self):
        """Test that a POST without a token returns 401."""
        response = self._post(self._payload())
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_post_returns_403(self):
        """Test that a POST from a user unrelated to the game returns 403."""
        response = self._post(self._payload(), token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_dm_can_create_poll(self):
        """Test that the DM of the game can create a poll and receives 201."""
        response = self._post(self._payload(), token=self.dm_token)
        assert response.status_code == 201

    def test_player_can_create_poll(self):
        """Test that a player of the game can create a poll and receives 201."""
        response = self._post(self._payload(), token=self.player_token)
        assert response.status_code == 201

    def test_superuser_can_create_poll(self):
        """Test that a superuser can create a poll and receives 201."""
        response = self._post(self._payload(), token=self.superuser_token)
        assert response.status_code == 201

    def test_staff_can_create_poll(self):
        """Test that a staff user can create a poll and receives 201."""
        response = self._post(self._payload(), token=self.staff_token)
        assert response.status_code == 201

    def test_create_returns_poll_detail_with_options(self):
        """Test that the response body contains the poll detail shape, options included."""
        response = self._post(self._payload(), token=self.dm_token)
        data = json.loads(response.content)
        assert data['title'] == 'Which tavern?'
        assert data['description'] == 'Pick one for tonight.'
        assert data['type'] == Poll.TYPE_SINGLE
        assert data['status'] == Poll.STATUS_OPEN
        assert data['option_type'] == Poll.OPTION_TYPE_TEXT
        assert [option['option'] for option in data['options']] == [
            'The Drunken Griffin', 'The Rusty Anchor',
        ]
        assert all('id' in option for option in data['options'])

    def test_created_poll_option_type_defaults_to_text_when_omitted(self):
        """Test that omitting option_type defaults the created poll's option_type to text."""
        response = self._post(self._payload(), token=self.dm_token)
        data = json.loads(response.content)
        assert data['option_type'] == Poll.OPTION_TYPE_TEXT

    def test_created_poll_can_have_option_type_date(self):
        """Test that a poll can be created with option_type=date and it's returned as such."""
        response = self._post(
            self._payload(option_type=Poll.OPTION_TYPE_DATE), token=self.dm_token,
        )
        data = json.loads(response.content)
        assert response.status_code == 201
        assert data['option_type'] == Poll.OPTION_TYPE_DATE

    def test_created_poll_status_is_forced_to_open(self):
        """Test that a newly created poll's status is always open, regardless of payload."""
        response = self._post(self._payload(status=Poll.STATUS_CLOSED), token=self.dm_token)
        data = json.loads(response.content)
        assert data['status'] == Poll.STATUS_OPEN

    def test_created_poll_and_options_persist_to_database(self):
        """Test that the created poll and its options are persisted and linked to the game."""
        self._post(self._payload(), token=self.dm_token)
        poll = Poll.objects.get(game=self.game, title='Which tavern?')
        assert poll.status == Poll.STATUS_OPEN
        assert list(poll.options.values_list('option', flat=True)) == [
            'The Drunken Griffin', 'The Rusty Anchor',
        ]

    def test_missing_title_returns_400(self):
        """Test that a POST without title returns 400."""
        response = self._post(self._payload(title=''), token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'title' in data['errors']

    def test_missing_options_returns_400(self):
        """Test that a POST without options returns 400."""
        response = self._post(self._payload(options=[]), token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'options' in data['errors']

    def test_accepts_options_payload_at_max_cap(self):
        """Test that exactly MAX_OPTIONS entries is accepted."""
        options = [{'option': f'Option {i}'} for i in range(MAX_OPTIONS)]
        response = self._post(self._payload(options=options), token=self.dm_token)
        assert response.status_code == 201

    def test_rejects_options_payload_over_max_cap(self):
        """Test that more than MAX_OPTIONS entries is rejected with a 400 on options."""
        options = [{'option': f'Option {i}'} for i in range(MAX_OPTIONS + 1)]
        response = self._post(self._payload(options=options), token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'options' in data['errors']

    def test_description_over_max_length_returns_400(self):
        """Test that a description longer than the model's max_length returns 400."""
        response = self._post(
            self._payload(description='x' * 5001), token=self.dm_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'description' in data['errors']

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._post(self._payload(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(self._payload(), token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404
