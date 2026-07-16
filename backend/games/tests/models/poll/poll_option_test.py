"""Tests for the PollOption model."""

from django.test import TestCase

from games.models import PollOption
from games.tests.factories import PollFactory, PollOptionFactory


class TestPollOption(TestCase):
    """Tests for the PollOption model."""

    @classmethod
    def setUpTestData(cls):
        """Set up common test fixtures."""
        cls.poll = PollFactory()

    def test_poll_option_creation(self):
        """Test that a poll option can be created linking a poll with a label."""
        option = PollOptionFactory(poll=self.poll, option='Yes')
        assert option.poll == self.poll
        assert option.option == 'Yes'

    def test_poll_option_str(self):
        """Test string representation of a poll option."""
        option = PollOption(poll=self.poll, option='Yes')
        assert str(option) == 'Yes'

    def test_poll_option_ordering(self):
        """Test that poll options are ordered by id."""
        first = PollOptionFactory(poll=self.poll, option='Yes')
        second = PollOptionFactory(poll=self.poll, option='No')
        options = list(PollOption.objects.all())
        assert options[0].id == first.id
        assert options[1].id == second.id

    def test_options_related_name_on_poll(self):
        """Test that poll options can be accessed via the poll's related name."""
        PollOptionFactory(poll=self.poll, option='Yes')
        PollOptionFactory(poll=self.poll, option='No')
        assert self.poll.options.count() == 2

    def test_deleting_poll_cascades_to_poll_option(self):
        """Test that deleting a poll deletes its poll options."""
        option = PollOptionFactory(poll=self.poll)
        self.poll.delete()
        assert not PollOption.objects.filter(id=option.id).exists()

    def test_selected_defaults_to_false(self):
        """Test that a new poll option is not selected by default."""
        option = PollOptionFactory(poll=self.poll)
        assert option.selected is False
