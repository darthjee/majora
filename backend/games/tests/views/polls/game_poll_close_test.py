"""Tests for the game poll close view (PATCH)."""

import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.models import GameSession, Poll, PollOption, PollVote
from games.tests.factories import (
    GameFactory,
    PlayerFactory,
    PollFactory,
    PollOptionFactory,
    SuperUserFactory,
    UserFactory,
)


class TestGamePollCloseView(TestCase):
    """Tests for the PATCH /games/<slug>/polls/<id>/close.json endpoint."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, an open poll with options, a DM, players, an admin, and an outsider."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.other_game = GameFactory(name='Other Game', game_slug='other-game')
        cls.poll = PollFactory(
            game=cls.game, title='Which tavern?', type=Poll.TYPE_SINGLE, status=Poll.STATUS_OPEN,
        )
        cls.option_one = PollOptionFactory(poll=cls.poll, option='The Drunken Griffin')
        cls.option_two = PollOptionFactory(poll=cls.poll, option='The Rusty Anchor')
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

    def _patch(self, payload=None, token=None, game_slug=None, poll_id=None):
        """Issue a PATCH request to the poll close endpoint, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        slug = game_slug or self.game.game_slug
        pid = poll_id if poll_id is not None else self.poll.id
        url = f'/games/{slug}/polls/{pid}/close.json'
        return self.client.patch(
            url, data=json.dumps(payload or {}), content_type='application/json', **extra,
        )

    def test_unauthenticated_patch_returns_401(self):
        """Test that a PATCH without a token returns 401."""
        response = self._patch()
        assert response.status_code == 401
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_outsider_patch_returns_403(self):
        """Test that a PATCH from a user unrelated to the game returns 403."""
        response = self._patch(token=self.outsider_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_player_patch_returns_403(self):
        """Test that a plain player of the game cannot close the poll."""
        response = self._patch(token=self.player_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_staff_patch_returns_403(self):
        """Test that a pure staff user (not DM/superuser) cannot close the poll."""
        response = self._patch(token=self.staff_token)
        assert response.status_code == 403
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_dm_can_close(self):
        """Test that the game's DM can close the poll."""
        response = self._patch(token=self.dm_token)
        assert response.status_code == 200

    def test_superuser_can_close(self):
        """Test that a superuser can close the poll."""
        response = self._patch(token=self.superuser_token)
        assert response.status_code == 200

    def test_empty_payload_picks_option_with_most_votes(self):
        """Test that an empty payload auto-picks the option with the most votes."""
        PollVote.objects.create(user=self.player_user, option=self.option_two)
        PollVote.objects.create(user=self.dm_user, option=self.option_two)

        response = self._patch(token=self.dm_token)

        assert response.status_code == 200
        self.option_one.refresh_from_db()
        self.option_two.refresh_from_db()
        assert self.option_two.selected is True
        assert self.option_one.selected is False

    def test_empty_payload_breaks_tie_by_lowest_id(self):
        """Test that a tie in vote count is broken in favor of the lowest option id."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)
        PollVote.objects.create(user=self.dm_user, option=self.option_two)

        response = self._patch(token=self.dm_token)

        assert response.status_code == 200
        self.option_one.refresh_from_db()
        self.option_two.refresh_from_db()
        assert self.option_one.selected is True
        assert self.option_two.selected is False

    def test_empty_payload_with_no_votes_picks_lowest_id(self):
        """Test that an empty payload with zero votes cast still picks the lowest-id option."""
        response = self._patch(token=self.dm_token)

        assert response.status_code == 200
        self.option_one.refresh_from_db()
        assert self.option_one.selected is True

    def test_explicit_option_id_overrides_vote_counts(self):
        """Test that an explicit option_id wins regardless of vote counts."""
        PollVote.objects.create(user=self.player_user, option=self.option_one)

        response = self._patch({'option_id': self.option_two.id}, token=self.dm_token)

        assert response.status_code == 200
        self.option_one.refresh_from_db()
        self.option_two.refresh_from_db()
        assert self.option_two.selected is True
        assert self.option_one.selected is False

    def test_close_sets_poll_status_to_closed(self):
        """Test that closing the poll sets its status to closed."""
        response = self._patch(token=self.dm_token)

        assert response.status_code == 200
        self.poll.refresh_from_db()
        assert self.poll.status == Poll.STATUS_CLOSED

    def test_closing_a_non_open_poll_returns_400(self):
        """Test that closing an already-closed poll returns 400 and changes nothing."""
        self.poll.status = Poll.STATUS_CLOSED
        self.poll.save()

        response = self._patch(token=self.dm_token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']
        self.option_one.refresh_from_db()
        self.option_two.refresh_from_db()
        assert self.option_one.selected is False
        assert self.option_two.selected is False

    def test_closing_an_inactive_poll_returns_400(self):
        """Test that closing a still-inactive poll returns 400."""
        self.poll.status = Poll.STATUS_INACTIVE
        self.poll.save()

        response = self._patch(token=self.dm_token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']

    def test_option_id_not_belonging_to_poll_returns_400(self):
        """Test that an option_id from a different poll's options returns 400."""
        other_poll = PollFactory(game=self.game, status=Poll.STATUS_OPEN)
        other_option = PollOptionFactory(poll=other_poll)

        response = self._patch({'option_id': other_option.id}, token=self.dm_token)

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']
        self.poll.refresh_from_db()
        assert self.poll.status == Poll.STATUS_OPEN

    def test_response_shape_includes_status_and_selected_option(self):
        """Test that the response body reflects the closed status and selected option."""
        response = self._patch({'option_id': self.option_two.id}, token=self.dm_token)

        data = json.loads(response.content)
        assert data['status'] == Poll.STATUS_CLOSED
        options_by_id = {option['id']: option for option in data['options']}
        assert options_by_id[self.option_two.id]['selected'] is True
        assert options_by_id[self.option_one.id]['selected'] is False

    def test_response_includes_skip_cache_header(self):
        """Test that the response includes the X-Skip-Cache header."""
        response = self._patch(token=self.dm_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_returns_404_for_unknown_game_slug(self):
        """Test that 404 is returned for a non-existent game slug."""
        response = self._patch(token=self.dm_token, game_slug='unknown-game')
        assert response.status_code == 404

    def test_returns_404_for_nonexistent_poll_id(self):
        """Test that 404 is returned for a non-existent poll id."""
        response = self._patch(token=self.dm_token, poll_id=999999)
        assert response.status_code == 404

    def test_returns_404_when_poll_belongs_to_different_game(self):
        """Test that 404 is returned when poll_id does not belong to game_slug."""
        response = self._patch(token=self.dm_token, game_slug=self.other_game.game_slug)
        assert response.status_code == 404

    def test_url_by_name(self):
        """Test that the view is accessible by URL name."""
        url = reverse(
            'game-poll-close', kwargs={'game_slug': 'test-game', 'poll_id': self.poll.id},
        )
        response = self.client.patch(
            url, data=json.dumps({}), content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 200

    def test_get_not_allowed(self):
        """Test that GET is not supported on the poll close route."""
        response = self.client.get(
            f'/games/{self.game.game_slug}/polls/{self.poll.id}/close.json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )
        assert response.status_code == 405

    def test_closed_poll_blocks_further_voting(self):
        """Test that a poll closed via this endpoint then rejects the votes endpoint."""
        self._patch(token=self.dm_token)

        response = self.client.put(
            f'/games/{self.game.game_slug}/polls/{self.poll.id}/votes.json',
            data=json.dumps({'option_ids': [self.option_one.id]}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.player_token.key}',
        )

        assert response.status_code == 400


class TestGamePollCloseMultipleType(TestCase):
    """Tests exercising the close endpoint against a multiple-type poll."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game and a multiple-type open poll with three options."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.poll = PollFactory(game=cls.game, type=Poll.TYPE_MULTIPLE, status=Poll.STATUS_OPEN)
        cls.option_a = PollOptionFactory(poll=cls.poll, option='A')
        cls.option_b = PollOptionFactory(poll=cls.poll, option='B')
        cls.option_c = PollOptionFactory(poll=cls.poll, option='C')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

    def test_closing_a_multiple_type_poll_resolves_to_a_single_winner(self):
        """Test that closing a multiple-type poll still selects exactly one winning option."""
        PollVote.objects.create(user=self.dm_user, option=self.option_b)

        response = self.client.patch(
            f'/games/{self.game.game_slug}/polls/{self.poll.id}/close.json',
            data=json.dumps({}), content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )

        assert response.status_code == 200
        selected = PollOption.objects.filter(poll=self.poll, selected=True)
        assert selected.count() == 1
        assert selected.first() == self.option_b


class TestGamePollCloseSessionLinked(TestCase):
    """Tests exercising the close endpoint against a session-linked, date-type poll."""

    @classmethod
    def setUpTestData(cls):
        """Set up a game, a session, and an open date poll linked to the session."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')
        cls.session = GameSession.objects.create(game=cls.game, title='Session One')
        cls.poll = PollFactory(
            game=cls.game,
            type=Poll.TYPE_SINGLE,
            status=Poll.STATUS_OPEN,
            option_type=Poll.OPTION_TYPE_DATE,
            content_object=cls.session,
        )
        cls.option_one = PollOptionFactory(poll=cls.poll, option='2026-08-01')
        cls.option_two = PollOptionFactory(poll=cls.poll, option='2026-08-08')
        cls.dm_user = UserFactory(username='dm_user', password='secret-password')
        PlayerFactory(game=cls.game, user=cls.dm_user, is_dm=True)
        cls.dm_token = Token.objects.create(user=cls.dm_user)

    def _patch(self, payload=None):
        """Issue a PATCH request to the poll close endpoint as the game's DM."""
        return self.client.patch(
            f'/games/{self.game.game_slug}/polls/{self.poll.id}/close.json',
            data=json.dumps(payload or {}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )

    def test_closing_by_vote_tally_sets_session_date(self):
        """Test that closing via vote tally parses the winner into the session's date."""
        PollVote.objects.create(user=self.dm_user, option=self.option_two)

        response = self._patch()

        assert response.status_code == 200
        self.session.refresh_from_db()
        assert self.session.date.isoformat() == '2026-08-08'

    def test_closing_by_explicit_option_id_sets_session_date(self):
        """Test that closing via an explicit option_id parses the winner into the session's date."""
        response = self._patch({'option_id': self.option_one.id})

        assert response.status_code == 200
        self.session.refresh_from_db()
        assert self.session.date.isoformat() == '2026-08-01'

    def test_unparseable_option_returns_400_and_rolls_back(self):
        """Test that an unparseable option string aborts the close entirely."""
        bad_option = PollOptionFactory(poll=self.poll, option='not-a-date')

        response = self._patch({'option_id': bad_option.id})

        assert response.status_code == 400
        data = json.loads(response.content)
        assert 'detail' in data['errors']
        self.poll.refresh_from_db()
        bad_option.refresh_from_db()
        assert self.poll.status == Poll.STATUS_OPEN
        assert bad_option.selected is False
        self.session.refresh_from_db()
        assert self.session.date is None

    def test_closing_a_poll_with_no_linked_entity_is_unaffected(self):
        """Test that closing a poll with no linked entity behaves exactly as before."""
        unlinked_poll = PollFactory(game=self.game, status=Poll.STATUS_OPEN)
        option = PollOptionFactory(poll=unlinked_poll, option='Some choice')

        response = self.client.patch(
            f'/games/{self.game.game_slug}/polls/{unlinked_poll.id}/close.json',
            data=json.dumps({'option_id': option.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {self.dm_token.key}',
        )

        assert response.status_code == 200
        unlinked_poll.refresh_from_db()
        option.refresh_from_db()
        assert unlinked_poll.status == Poll.STATUS_CLOSED
        assert option.selected is True
