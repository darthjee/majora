"""Tests for the game poll votes view (GET list / PUT cast)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import Poll, PollVote
from games.tests.factories import (
    GameFactory,
    GameMasterFactory,
    PlayerFactory,
    PollFactory,
    PollOptionFactory,
    SuperUserFactory,
    UserFactory,
    UserProfileFactory,
)


class TestGamePollVotesGetView(TestCase):
    """Tests for the GET /games/<slug>/polls/<id>/votes.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a poll with options, a DM, players, an admin, and an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.poll = PollFactory(game=cls.game, type=Poll.TYPE_SINGLE, status=Poll.STATUS_OPEN)
        cls.option_one = PollOptionFactory(poll=cls.poll, option='The Drunken Griffin')
        cls.option_two = PollOptionFactory(poll=cls.poll, option='The Rusty Anchor')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        GameMasterFactory(game=cls.game, user=cls.dm_user)
        cls.dm_token = Token.objects.create(user=cls.dm_user)
        cls.player_user = UserFactory(username='player_user', password='secret-password')
        UserProfileFactory(user=cls.player_user, display_name='player_display')
        cls.player = PlayerFactory(name='Bob', user=cls.player_user, game=cls.game)
        cls.player_token = Token.objects.create(user=cls.player_user)
        cls.other_player_user = UserFactory(
            username='other_player_user', password='secret-password',
        )
        cls.other_player = PlayerFactory(name='Alice', user=cls.other_player_user, game=cls.game)
        cls.other_player_token = Token.objects.create(user=cls.other_player_user)
        cls.superuser = SuperUserFactory(username='admin', password='secret-password')
        cls.superuser_token = Token.objects.create(user=cls.superuser)
        cls.staff_user = UserFactory(
            username='staff_user', password='secret-password', is_staff=True,
        )
        cls.staff_token = Token.objects.create(user=cls.staff_user)
        cls.outsider = UserFactory(username='outsider', password='secret-password')
        cls.outsider_token = Token.objects.create(user=cls.outsider)

    def _get(self, token=None, game_slug=None, poll_id=None, query=''):
        """Issue a GET request to the poll votes endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        pid = poll_id if poll_id is not None else self.poll.id
        url = f'/games/{slug}/polls/{pid}/votes.json{query}'
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
        """Test that the DM of the game can view the votes."""
        response = self._get(token=self.dm_token)
        assert response.status_code == 200

    def test_player_can_view(self):
        """Test that a player of the game can view the votes."""
        response = self._get(token=self.player_token)
        assert response.status_code == 200

    def test_superuser_can_view(self):
        """Test that a superuser (pure admin) can view the votes."""
        response = self._get(token=self.superuser_token)
        assert response.status_code == 200

    def test_staff_can_view(self):
        """Test that a staff user (pure admin) can view the votes."""
        response = self._get(token=self.staff_token)
        assert response.status_code == 200

    def test_returns_every_vote_when_no_user_id_filter(self):
        """Test that all voters' votes are returned when no ?user_id= is given."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        PollVote.objects.create(user=self.other_player_user, option=self.option_two)
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert len(data['votes']) == 2

    def test_user_id_filter_narrows_to_one_user(self):
        """Test that ?user_id= filters the votes list to that user's vote(s)."""
        vote = PollVote.objects.create(user=self.player_user, option=self.option_one)
        PollVote.objects.create(user=self.other_player_user, option=self.option_two)
        response = self._get(token=self.dm_token, query=f'?user_id={self.player_user.id}')
        data = json.loads(response.content)
        assert len(data['votes']) == 1
        assert data['votes'][0]['id'] == vote.id

    def test_user_id_filter_can_target_another_users_votes(self):
        """Test that ?user_id= is not restricted to the requester's own id."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        other_vote = PollVote.objects.create(user=self.other_player_user, option=self.option_two)
        response = self._get(token=self.dm_token, query=f'?user_id={self.other_player_user.id}')
        data = json.loads(response.content)
        assert len(data['votes']) == 1
        assert data['votes'][0]['id'] == other_vote.id

    def test_invalid_user_id_filter_returns_every_vote(self):
        """Test that a non-numeric ?user_id= is tolerated and returns every vote."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        response = self._get(token=self.dm_token, query='?user_id=not-a-number')
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data['votes']) == 1

    def test_returns_expected_payload_shape(self):
        """Test that each vote entry includes id, option, and user_id."""
        vote = PollVote.objects.create(user=self.player_user, option=self.option_one)
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data['votes'] == [
            {'id': vote.id, 'option': self.option_one.id, 'user_id': self.player_user.id},
        ]

    def test_votes_count_includes_every_option_with_zero_vote_options(self):
        """Test that votes_count lists every option, including ones with zero votes."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data['votes_count'] == [
            {'option': self.option_one.id, 'count': 1},
            {'option': self.option_two.id, 'count': 0},
        ]

    def test_votes_count_stays_full_poll_even_when_user_id_filter_is_applied(self):
        """Test that votes_count is never filtered by ?user_id=."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        PollVote.objects.create(user=self.other_player_user, option=self.option_two)
        response = self._get(token=self.dm_token, query=f'?user_id={self.player_user.id}')
        data = json.loads(response.content)
        assert data['votes_count'] == [
            {'option': self.option_one.id, 'count': 1},
            {'option': self.option_two.id, 'count': 1},
        ]

    def test_users_only_includes_voters_present_in_the_filtered_votes(self):
        """Test that users is scoped to the (possibly filtered) votes result."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        PollVote.objects.create(user=self.other_player_user, option=self.option_two)
        response = self._get(token=self.dm_token, query=f'?user_id={self.player_user.id}')
        data = json.loads(response.content)
        assert [user['id'] for user in data['users']] == [self.player_user.id]

    def test_users_include_name_and_avatar_url(self):
        """Test that each user entry includes id, name, and avatar_url."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data['users'] == [
            {
                'id': self.player_user.id,
                'name': 'player_display',
                'avatar_url': None,
            },
        ]

    def test_users_name_is_the_display_name_not_the_real_username(self):
        """Test that the exposed voter name never leaks the real username/login credential."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        response = self._get(token=self.dm_token)
        data = json.loads(response.content)
        assert data['users'][0]['name'] != self.player_user.username

    def test_users_list_a_single_voter_once_for_a_multiple_type_poll(self):
        """Test that a user voting for more than one option appears once in users."""
        multiple_poll = PollFactory(
            game=self.game, type=Poll.TYPE_MULTIPLE, status=Poll.STATUS_OPEN,
        )
        option_a = PollOptionFactory(poll=multiple_poll, option='A')
        option_b = PollOptionFactory(poll=multiple_poll, option='B')
        PollVote.objects.create(user=self.player_user, option=option_a)
        PollVote.objects.create(user=self.player_user, option=option_b)
        response = self._get(token=self.dm_token, poll_id=multiple_poll.id)
        data = json.loads(response.content)
        assert len(data['users']) == 1
        assert data['users'][0]['id'] == self.player_user.id
        assert len(data['votes']) == 2

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
            'game-poll-votes', kwargs={'game_slug': 'test-game', 'poll_id': self.poll.id},
        )
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Token {self.dm_token.key}')
        assert response.status_code == 200


class TestGamePollVotesPutView(TestCase):
    """Tests for the PUT /games/<slug>/polls/<id>/votes.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game with single and multiple type polls, a DM, players, and an admin."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.single_poll = PollFactory(
            game=cls.game, type=Poll.TYPE_SINGLE, status=Poll.STATUS_OPEN,
        )
        cls.single_option_one = PollOptionFactory(poll=cls.single_poll, option='Yes')
        cls.single_option_two = PollOptionFactory(poll=cls.single_poll, option='No')
        cls.multiple_poll = PollFactory(
            game=cls.game, type=Poll.TYPE_MULTIPLE, status=Poll.STATUS_OPEN,
        )
        cls.multiple_option_a = PollOptionFactory(poll=cls.multiple_poll, option='A')
        cls.multiple_option_b = PollOptionFactory(poll=cls.multiple_poll, option='B')
        cls.multiple_option_c = PollOptionFactory(poll=cls.multiple_poll, option='C')

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

    def _put(self, option_ids, token=None, game_slug=None, poll_id=None):
        """Issue a PUT request to the poll votes endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        pid = poll_id if poll_id is not None else self.single_poll.id
        url = f'/games/{slug}/polls/{pid}/votes.json'
        return self.client.put(
            url, data=json.dumps({'option_ids': option_ids}), content_type='application/json',
            **extra,
        )

    def test_unauthenticated_put_returns_401(self):
        """Test that a PUT without a token returns 401."""
        response = self._put([self.single_option_one.id])
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_put_returns_403(self):
        """Test that a PUT from a user unrelated to the game returns 403."""
        response = self._put([self.single_option_one.id], token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_superuser_put_returns_403(self):
        """Test that a pure superuser (not a player/DM) cannot vote, even though it can view."""
        response = self._put([self.single_option_one.id], token=self.superuser_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_staff_put_returns_403(self):
        """Test that a pure staff user (not a player/DM) cannot vote, even though it can view."""
        response = self._put([self.single_option_one.id], token=self.staff_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_dm_without_player_row_can_vote(self):
        """Test that a DM with no Player row can cast a vote."""
        response = self._put([self.single_option_one.id], token=self.dm_token)
        assert response.status_code == 200
        assert PollVote.objects.filter(
            user=self.dm_user, option=self.single_option_one,
        ).exists()

    def test_player_can_vote(self):
        """Test that a player of the game can cast a vote."""
        response = self._put([self.single_option_one.id], token=self.player_token)
        assert response.status_code == 200
        assert PollVote.objects.filter(
            user=self.player_user, option=self.single_option_one,
        ).exists()

    def test_response_returns_only_requesting_users_votes(self):
        """Test that the response body only includes the requesting user's own votes."""
        PollVote.objects.create(user=self.dm_user, option=self.single_option_one)
        response = self._put([self.single_option_two.id], token=self.player_token)
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['user_id'] == self.player_user.id

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._put([self.single_option_one.id], token=self.player_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_single_type_switching_option_updates_row_in_place(self):
        """Test that switching a single-type vote updates the existing row, never a second row."""
        self._put([self.single_option_one.id], token=self.player_token)
        vote_id = PollVote.objects.get(user=self.player_user).id

        self._put([self.single_option_two.id], token=self.player_token)

        assert PollVote.objects.filter(user=self.player_user).count() == 1
        updated_vote = PollVote.objects.get(user=self.player_user)
        assert updated_vote.id == vote_id
        assert updated_vote.option_id == self.single_option_two.id

    def test_single_type_empty_payload_clears_the_vote(self):
        """Test that an empty option_ids payload clears the user's single-type vote."""
        self._put([self.single_option_one.id], token=self.player_token)

        response = self._put([], token=self.player_token)

        assert response.status_code == 200
        assert json.loads(response.content) == []
        assert not PollVote.objects.filter(user=self.player_user).exists()

    def test_single_type_more_than_one_option_returns_400(self):
        """Test that submitting more than one option id on a single-type poll returns 400."""
        response = self._put(
            [self.single_option_one.id, self.single_option_two.id], token=self.player_token,
        )
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'option_ids' in data['errors']

    def test_multiple_type_add_and_remove_diffing(self):
        """Test that multiple-type voting creates newly selected and drops deselected options."""
        self._put(
            [self.multiple_option_a.id, self.multiple_option_b.id], token=self.player_token,
            poll_id=self.multiple_poll.id,
        )

        response = self._put(
            [self.multiple_option_b.id, self.multiple_option_c.id], token=self.player_token,
            poll_id=self.multiple_poll.id,
        )

        assert response.status_code == 200
        remaining = set(
            PollVote.objects.filter(user=self.player_user, option__poll=self.multiple_poll)
            .values_list('option_id', flat=True),
        )
        assert remaining == {self.multiple_option_b.id, self.multiple_option_c.id}

    def test_multiple_type_does_not_affect_other_users_votes(self):
        """Test that a multiple-type vote only touches the requesting user's own rows."""
        PollVote.objects.create(user=self.dm_user, option=self.multiple_option_a)

        self._put(
            [self.multiple_option_b.id], token=self.player_token, poll_id=self.multiple_poll.id,
        )

        assert PollVote.objects.filter(
            user=self.dm_user, option=self.multiple_option_a,
        ).exists()

    def test_invalid_option_id_returns_400(self):
        """Test that an option id not belonging to the poll returns 400."""
        response = self._put([999999], token=self.player_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'option_ids' in data['errors']

    def test_option_id_belonging_to_another_poll_returns_400(self):
        """Test that an option id from a different poll of the same game returns 400."""
        response = self._put([self.multiple_option_a.id], token=self.player_token)
        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'option_ids' in data['errors']

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._put(
            [self.single_option_one.id], token=self.player_token, game_slug='unknown-game',
        )
        assert response.status_code == 404

    def test_returns_404_for_nonexistent_poll_id(self):
        """Test that 404 is returned for a non-existent poll id."""
        response = self._put([1], token=self.player_token, poll_id=999999)
        assert response.status_code == 404

    def test_put_on_non_open_poll_returns_400(self):
        """Test that voting on a closed (non-open) poll is rejected with a 400."""
        self.single_poll.status = Poll.STATUS_CLOSED
        self.single_poll.save()

        response = self._put([self.single_option_one.id], token=self.player_token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']
        assert not PollVote.objects.filter(
            user=self.player_user, option=self.single_option_one,
        ).exists()

    def test_get_not_disturbed_by_missing_body_on_put_route(self):
        """Test that the votes route still responds to GET for the same poll."""
        response = self.client.get(
            f'/games/{self.game.game_slug}/polls/{self.single_poll.id}/votes.json',
            HTTP_AUTHORIZATION=f'Token {self.player_token.key}',
        )
        assert response.status_code == 200
