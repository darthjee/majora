"""Tests for the game poll detail view (GET only)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Poll
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    PollFactory,
    PollOptionFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGamePollDetailView(TestCase):
    """Tests for the GET /games/<slug>/polls/<id>.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a poll with options, a DM, a player, a superuser/staff, and an
        outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.poll = PollFactory(
            game=cls.game, title='Which tavern?', description='Pick one for tonight.',
            type=Poll.TYPE_SINGLE, status=Poll.STATUS_OPEN,
        )
        cls.option_one = PollOptionFactory(poll=cls.poll, option='The Drunken Griffin')
        cls.option_two = PollOptionFactory(poll=cls.poll, option='The Rusty Anchor')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
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

    def _get(self, token=None, game_slug=None, poll_id=None):
        """Issue a GET request to the poll detail endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        pid = poll_id if poll_id is not None else self.poll.id
        url = f'/games/{slug}/polls/{pid}.json'
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

    def test_dm_can_view(self):
        """Test that the DM of the game can view the poll."""
        response = self._get(token=self.dm_token)
        assert response.status_code == 200

    def test_player_can_view(self):
        """Test that a player of the game can view the poll."""
        response = self._get(token=self.player_token)
        assert response.status_code == 200

    def test_superuser_can_view(self):
        """Test that a superuser can view the poll."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 200

    def test_staff_can_view(self):
        """Test that a staff user can view the poll."""
        response = self._get(token=self.staff_token)
        assert response.status_code == 200

    def test_returns_expected_payload_shape_with_nested_options(self):
        """Test that the detail payload includes options nested with their own ids."""
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert set(data.keys()) == {
            'id', 'title', 'description', 'type', 'status', 'option_type', 'options',
        }
        assert data['id'] == self.poll.id
        assert data['title'] == 'Which tavern?'
        assert data['description'] == 'Pick one for tonight.'
        assert data['type'] == Poll.TYPE_SINGLE
        assert data['status'] == Poll.STATUS_OPEN
        assert data['option_type'] == Poll.OPTION_TYPE_TEXT
        assert data['options'] == [
            {'id': self.option_one.id, 'option': 'The Drunken Griffin', 'selected': False},
            {'id': self.option_two.id, 'option': 'The Rusty Anchor', 'selected': False},
        ]

    def test_returns_option_type_when_set_to_date(self):
        """Test that a poll's option_type of date is reflected in the detail response."""
        poll = PollFactory(game=self.game, option_type=Poll.OPTION_TYPE_DATE)
        response = self._get(token=self.dm_token, poll_id=poll.id)
        data = json.loads(response.content)
        assert data['option_type'] == Poll.OPTION_TYPE_DATE

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._get(token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._get(token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_returns_404_for_nonexistent_poll_id(self):
        """Test that 404 is returned for a non-existent poll id."""
        response = self._get(token=self.dm_token, poll_id=999999)
        assert response.status_code == 404

    def test_returns_404_when_poll_belongs_to_different_game(self):
        """Test that 404 is returned when poll_id does not belong to game_slug."""
        response = self._get(token=self.dm_token, game_slug=self.other_game.game_slug)
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-poll-detail', kwargs={'game_slug': 'test-game', 'poll_id': self.poll.id},
        )
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200

    def test_post_not_allowed(self):
        """Test that POST is not supported on the poll detail route."""
        response = self.client.post(
            f'/games/test-game/polls/{self.poll.id}.json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 405
