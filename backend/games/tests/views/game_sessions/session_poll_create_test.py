"""Tests for the session poll create view (POST)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession, Poll
from games.serializers.games.polls.poll_create import MAX_OPTIONS
from games.serializers.games.polls.session_poll_create import DEFAULT_TITLE
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    SuperUserFactory,
    UserFactory,
)


class TestSessionPollCreateView(TestCase):
    """Tests for the POST /games/<slug>/sessions/<id>/poll.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, a DM, a player, a superuser, a staff user, an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user)
        cls.player.games.add(cls.game)
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
        """Build a valid session poll creation payload, honoring any given overrides."""
        payload = {'dates': ['2026-08-01', '2026-08-08']}
        payload.update(overrides)
        return payload

    def _post(self, payload, token=None, game_slug=None, session_id=None):
        """Issue a POST request to the session poll create endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        sid = session_id if session_id is not None else self.session.id
        url = f'/games/{slug}/sessions/{sid}/poll.json'
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
        """Test that the DM of the game can create a session poll and receives 201."""
        response = self._post(self._payload(), token=self.dm_token)
        assert response.status_code == 201

    def test_player_can_create_poll(self):
        """Test that a player of the game can create a session poll and receives 201."""
        response = self._post(self._payload(), token=self.player_token)
        assert response.status_code == 201

    def test_superuser_can_create_poll(self):
        """Test that a superuser can create a session poll and receives 201."""
        response = self._post(self._payload(), token=self.superuser_token)
        assert response.status_code == 201

    def test_staff_can_create_poll(self):
        """Test that a staff user can create a session poll and receives 201."""
        response = self._post(self._payload(), token=self.staff_token)
        assert response.status_code == 201

    def test_created_poll_has_expected_attributes(self):
        """Test that the created poll has the expected type/status/option_type/title."""
        self._post(self._payload(), token=self.dm_token)
        poll = Poll.objects.get(game=self.game)
        assert poll.title == DEFAULT_TITLE
        assert poll.status == Poll.STATUS_OPEN
        assert poll.option_type == Poll.OPTION_TYPE_DATE
        assert poll.type == Poll.TYPE_MULTIPLE

    def test_created_poll_defaults_to_multiple_type_when_type_omitted(self):
        """Test that omitting `type` defaults the created poll's type to multiple."""
        self._post(self._payload(), token=self.dm_token)
        poll = Poll.objects.get(game=self.game)
        assert poll.type == Poll.TYPE_MULTIPLE

    def test_created_poll_type_single_when_requested(self):
        """Test that requesting `type='single'` creates a single-choice poll."""
        self._post(self._payload(type=Poll.TYPE_SINGLE), token=self.dm_token)
        poll = Poll.objects.get(game=self.game)
        assert poll.type == Poll.TYPE_SINGLE

    def test_created_poll_type_multiple_when_requested(self):
        """Test that requesting `type='multiple'` creates a multiple-choice poll."""
        self._post(self._payload(type=Poll.TYPE_MULTIPLE), token=self.dm_token)
        poll = Poll.objects.get(game=self.game)
        assert poll.type == Poll.TYPE_MULTIPLE

    def test_invalid_type_returns_400(self):
        """Test that an invalid `type` value returns 400 with a field error on type."""
        response = self._post(self._payload(type='bogus'), token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'type' in data['errors']

    def test_created_poll_is_linked_to_the_session(self):
        """Test that the created poll's content_object is the originating session."""
        self._post(self._payload(), token=self.dm_token)
        poll = Poll.objects.get(game=self.game)
        assert poll.content_object == self.session

    def test_created_poll_options_match_submitted_dates_in_order(self):
        """Test that the created poll has one option per submitted date, in order."""
        self._post(self._payload(dates=['2026-08-08', '2026-08-01']), token=self.dm_token)
        poll = Poll.objects.get(game=self.game)
        assert list(poll.options.values_list('option', flat=True)) == [
            '2026-08-08', '2026-08-01',
        ]

    def test_create_returns_poll_detail_shape(self):
        """Test that the response body matches PollDetailSerializer's shape."""
        response = self._post(self._payload(), token=self.dm_token)
        data = json.loads(response.content)
        assert set(data.keys()) == {
            'id', 'title', 'description', 'type', 'status', 'option_type', 'options',
        }
        assert data['title'] == DEFAULT_TITLE
        assert data['type'] == Poll.TYPE_MULTIPLE
        assert data['status'] == Poll.STATUS_OPEN
        assert data['option_type'] == Poll.OPTION_TYPE_DATE
        assert [option['option'] for option in data['options']] == [
            '2026-08-01', '2026-08-08',
        ]
        assert all('id' in option for option in data['options'])

    def test_missing_dates_returns_400(self):
        """Test that a POST without dates returns 400."""
        response = self._post({}, token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'dates' in data['errors']

    def test_empty_dates_returns_400(self):
        """Test that a POST with an empty dates list returns 400."""
        response = self._post(self._payload(dates=[]), token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'dates' in data['errors']

    def test_accepts_dates_payload_at_max_cap(self):
        """Test that exactly MAX_OPTIONS dates is accepted."""
        dates = [f'2026-{(i % 12) + 1:02d}-01' for i in range(MAX_OPTIONS)]
        response = self._post(self._payload(dates=dates), token=self.dm_token)
        assert response.status_code == 201

    def test_rejects_dates_payload_over_max_cap(self):
        """Test that more than MAX_OPTIONS dates is rejected with a 400 on dates."""
        dates = [f'2026-{(i % 12) + 1:02d}-01' for i in range(MAX_OPTIONS + 1)]
        response = self._post(self._payload(dates=dates), token=self.dm_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'dates' in data['errors']

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._post(self._payload(), token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_post_returns_404_for_unknown_game_slug(self):
        """Test that POST returns 404 for a non-existent game slug."""
        response = self._post(self._payload(), token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_post_returns_404_for_unknown_session_id(self):
        """Test that POST returns 404 for a non-existent session id."""
        response = self._post(self._payload(), token=self.dm_token, session_id=999999)
        assert response.status_code == 404

    def test_post_returns_404_when_session_belongs_to_different_game(self):
        """Test that POST returns 404 when session_id does not belong to game_slug."""
        response = self._post(
            self._payload(),
            token=self.dm_token,
            game_slug=self.other_game.game_slug,
            session_id=self.session.id,
        )
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-session-poll-create',
            kwargs={'game_slug': 'test-game', 'session_id': self.session.id},
        )
        response = self.client.post(
            url,
            data=json.dumps(self._payload()),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 201
