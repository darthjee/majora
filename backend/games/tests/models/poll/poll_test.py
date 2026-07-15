"""Tests for the Poll model."""

from django.test import TestCase

from games.models import Poll
from games.tests.factories import GameFactory, PollFactory


class TestPoll(TestCase):
    """Tests for the Poll model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.game = GameFactory(name='Test Game', game_slug='test-game')

    def test_poll_creation(self):
        """Test that a poll can be created linking a game with a type and status."""
        poll = PollFactory(game=self.game, type=Poll.TYPE_MULTIPLE, status=Poll.STATUS_OPEN)
        assert poll.game == self.game
        assert poll.type == Poll.TYPE_MULTIPLE
        assert poll.status == Poll.STATUS_OPEN

    def test_type_defaults_to_single(self):
        """Test that type defaults to TYPE_SINGLE when not specified."""
        poll = Poll.objects.create(game=self.game)
        assert poll.type == Poll.TYPE_SINGLE

    def test_status_defaults_to_inactive(self):
        """Test that status defaults to STATUS_INACTIVE when not specified."""
        poll = Poll.objects.create(game=self.game)
        assert poll.status == Poll.STATUS_INACTIVE

    def test_title_defaults_to_blank(self):
        """Test that title defaults to an empty string when not specified."""
        poll = Poll.objects.create(game=self.game)
        assert poll.title == ''

    def test_description_defaults_to_blank(self):
        """Test that description defaults to an empty string when not specified."""
        poll = Poll.objects.create(game=self.game)
        assert poll.description == ''

    def test_poll_creation_with_title_and_description(self):
        """Test that a poll can be created with a title and description."""
        poll = PollFactory(
            game=self.game, title='Which tavern?', description='Pick one for tonight.',
        )
        assert poll.title == 'Which tavern?'
        assert poll.description == 'Pick one for tonight.'

    def test_poll_str(self):
        """Test string representation of a poll."""
        poll = Poll(game=self.game, type=Poll.TYPE_SINGLE)
        assert str(poll) == 'Poll(game=Test Game, type=single)'

    def test_poll_ordering(self):
        """Test that polls are ordered by id."""
        first = PollFactory(game=self.game)
        second = PollFactory(game=self.game)
        polls = list(Poll.objects.all())
        assert polls[0].id == first.id
        assert polls[1].id == second.id

    def test_polls_related_name_on_game(self):
        """Test that polls can be accessed via the game's related name."""
        PollFactory(game=self.game)
        PollFactory(game=self.game)
        assert self.game.polls.count() == 2

    def test_deleting_game_cascades_to_poll(self):
        """Test that deleting a game deletes its polls."""
        poll = PollFactory(game=self.game)
        self.game.delete()
        assert not Poll.objects.filter(id=poll.id).exists()
