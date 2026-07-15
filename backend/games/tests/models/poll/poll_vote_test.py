"""Tests for the PollVote model."""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from games.models import Poll, PollVote
from games.tests.factories import PlayerFactory, PollFactory, PollOptionFactory, PollVoteFactory


class TestPollVote(TestCase):
    """Tests for the PollVote model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.poll = PollFactory(type=Poll.TYPE_SINGLE)
        cls.option = PollOptionFactory(poll=cls.poll, option='Yes')
        cls.player = PlayerFactory()
        cls.player.games.add(cls.poll.game)

    def test_poll_vote_creation(self):
        """Test that a poll vote can be created for a player who belongs to the game."""
        vote = PollVoteFactory(player=self.player, option=self.option)
        assert vote.player == self.player
        assert vote.option == self.option

    def test_poll_vote_str(self):
        """Test string representation of a poll vote."""
        vote = PollVote(player=self.player, option=self.option)
        assert str(vote) == f'PollVote(player={self.player.name}, option=Yes)'

    def test_poll_vote_ordering(self):
        """Test that poll votes are ordered by id."""
        other_player = PlayerFactory(name='Other Player')
        other_player.games.add(self.poll.game)
        first = PollVoteFactory(player=self.player, option=self.option)
        second = PollVoteFactory(player=other_player, option=self.option)
        votes = list(PollVote.objects.all())
        assert votes[0].id == first.id
        assert votes[1].id == second.id

    def test_votes_related_name_on_option(self):
        """Test that poll votes can be accessed via the option's related name."""
        PollVoteFactory(player=self.player, option=self.option)
        assert self.option.votes.count() == 1

    def test_poll_votes_related_name_on_player(self):
        """Test that poll votes can be accessed via the player's related name."""
        PollVoteFactory(player=self.player, option=self.option)
        assert self.player.poll_votes.count() == 1

    def test_duplicate_poll_vote_raises_integrity_error(self):
        """Test that a second row for the same player/option pair is rejected."""
        PollVoteFactory(player=self.player, option=self.option)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                PollVoteFactory(player=self.player, option=self.option)

    def test_voting_for_player_not_in_game_raises_validation_error(self):
        """Test that a player not in the poll's game cannot vote."""
        outsider = PlayerFactory(name='Outsider')
        with pytest.raises(ValidationError):
            PollVoteFactory(player=outsider, option=self.option)

    def test_single_type_second_option_raises_validation_error(self):
        """Test that a second vote for a different option fails on a single-type poll."""
        other_option = PollOptionFactory(poll=self.poll, option='No')
        PollVoteFactory(player=self.player, option=self.option)
        with pytest.raises(ValidationError):
            PollVoteFactory(player=self.player, option=other_option)

    def test_single_type_same_option_raises_integrity_error(self):
        """Test a repeated vote for the same option raises IntegrityError.

        This confirms the DB-level constraint fires rather than the single-type
        ValidationError, since both rules could otherwise apply.
        """
        PollVoteFactory(player=self.player, option=self.option)
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                PollVoteFactory(player=self.player, option=self.option)

    def test_multiple_type_allows_several_options(self):
        """Test that a player may vote for several options on a multiple-type poll."""
        multiple_poll = PollFactory(game=self.poll.game, type=Poll.TYPE_MULTIPLE)
        option_a = PollOptionFactory(poll=multiple_poll, option='A')
        option_b = PollOptionFactory(poll=multiple_poll, option='B')
        PollVoteFactory(player=self.player, option=option_a)
        PollVoteFactory(player=self.player, option=option_b)
        assert self.player.poll_votes.filter(option__poll=multiple_poll).count() == 2

    def test_deleting_player_cascades_to_poll_vote(self):
        """Test that deleting a player deletes its poll votes."""
        vote = PollVoteFactory(player=self.player, option=self.option)
        self.player.delete()
        assert not PollVote.objects.filter(id=vote.id).exists()

    def test_deleting_option_cascades_to_poll_vote(self):
        """Test that deleting a poll option deletes its poll votes."""
        vote = PollVoteFactory(player=self.player, option=self.option)
        self.option.delete()
        assert not PollVote.objects.filter(id=vote.id).exists()

    def test_deleting_poll_cascades_to_poll_vote(self):
        """Test that deleting a poll deletes its poll votes through the option."""
        vote = PollVoteFactory(player=self.player, option=self.option)
        self.poll.delete()
        assert not PollVote.objects.filter(id=vote.id).exists()
