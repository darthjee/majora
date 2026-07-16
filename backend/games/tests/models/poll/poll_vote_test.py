"""Tests for the PollVote model."""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import Poll, PollVote
from games.tests.factories import (
    GameMasterFactory,
    PlayerFactory,
    PollFactory,
    PollOptionFactory,
    PollVoteFactory,
    UserFactory,
)


class TestPollVote(TestCase):
    """Tests for the PollVote model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.poll = PollFactory(type=Poll.TYPE_SINGLE)
        cls.option = PollOptionFactory(poll=cls.poll, option='Yes')
        cls.player = PlayerFactory(user=UserFactory())
        cls.player.games.add(cls.poll.game)

    def test_poll_vote_creation(self):
        """Test that a poll vote can be created for a user who belongs to the game."""
        vote = PollVoteFactory(user=self.player.user, option=self.option)
        assert vote.user == self.player.user
        assert vote.option == self.option

    def test_poll_vote_str(self):
        """Test string representation of a poll vote."""
        vote = PollVote(user=self.player.user, option=self.option)
        assert str(vote) == f'PollVote(user={self.player.user.username}, option=Yes)'

    def test_poll_vote_ordering(self):
        """Test that poll votes are ordered by id."""
        other_player = PlayerFactory(name='Other Player', user=UserFactory())
        other_player.games.add(self.poll.game)
        first = PollVoteFactory(user=self.player.user, option=self.option)
        second = PollVoteFactory(user=other_player.user, option=self.option)
        votes = list(PollVote.objects.all())
        assert votes[0].id == first.id
        assert votes[1].id == second.id

    def test_votes_related_name_on_option(self):
        """Test that poll votes can be accessed via the option's related name."""
        PollVoteFactory(user=self.player.user, option=self.option)
        assert self.option.votes.count() == 1

    def test_poll_votes_related_name_on_user(self):
        """Test that poll votes can be accessed via the user's related name."""
        PollVoteFactory(user=self.player.user, option=self.option)
        assert self.player.user.poll_votes.count() == 1

    def test_duplicate_poll_vote_raises_integrity_error(self):
        """Test that a second row for the same user/option pair is rejected."""
        PollVoteFactory(user=self.player.user, option=self.option)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                PollVoteFactory(user=self.player.user, option=self.option)

    def test_voting_for_user_not_in_game_raises_validation_error(self):
        """Test that a user not in the poll's game (player nor DM) cannot vote."""
        outsider = UserFactory(username='outsider')
        with pytest.raises(ValidationError):
            PollVoteFactory(user=outsider, option=self.option)

    def test_dm_without_player_row_can_vote(self):
        """Test that a DM with no Player row can still vote via the game-master membership."""
        dm_user = UserFactory(username='dm-only')
        GameMasterFactory(game=self.poll.game, user=dm_user)
        vote = PollVoteFactory(user=dm_user, option=self.option)
        assert vote.user == dm_user

    def test_single_type_second_option_raises_validation_error(self):
        """Test that a second vote for a different option fails on a single-type poll."""
        other_option = PollOptionFactory(poll=self.poll, option='No')
        PollVoteFactory(user=self.player.user, option=self.option)
        with pytest.raises(ValidationError):
            PollVoteFactory(user=self.player.user, option=other_option)

    def test_single_type_same_option_raises_integrity_error(self):
        """Test a repeated vote for the same option raises IntegrityError.

        This confirms the DB-level constraint fires rather than the single-type
        ValidationError, since both rules could otherwise apply.
        """
        PollVoteFactory(user=self.player.user, option=self.option)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                PollVoteFactory(user=self.player.user, option=self.option)

    def test_multiple_type_allows_several_options(self):
        """Test that a user may vote for several options on a multiple-type poll."""
        multiple_poll = PollFactory(game=self.poll.game, type=Poll.TYPE_MULTIPLE)
        option_a = PollOptionFactory(poll=multiple_poll, option='A')
        option_b = PollOptionFactory(poll=multiple_poll, option='B')
        PollVoteFactory(user=self.player.user, option=option_a)
        PollVoteFactory(user=self.player.user, option=option_b)
        assert self.player.user.poll_votes.filter(option__poll=multiple_poll).count() == 2

    def test_deleting_user_cascades_to_poll_vote(self):
        """Test that deleting a user deletes its poll votes."""
        vote = PollVoteFactory(user=self.player.user, option=self.option)
        self.player.user.delete()
        assert not PollVote.objects.filter(id=vote.id).exists()

    def test_deleting_option_cascades_to_poll_vote(self):
        """Test that deleting a poll option deletes its poll votes."""
        vote = PollVoteFactory(user=self.player.user, option=self.option)
        self.option.delete()
        assert not PollVote.objects.filter(id=vote.id).exists()

    def test_deleting_poll_cascades_to_poll_vote(self):
        """Test that deleting a poll deletes its poll votes through the option."""
        vote = PollVoteFactory(user=self.player.user, option=self.option)
        self.poll.delete()
        assert not PollVote.objects.filter(id=vote.id).exists()
