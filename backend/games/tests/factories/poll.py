"""Factories for `Poll`, `PollOption` and `PollVote`."""

import factory

from games.models import Poll, PollOption, PollVote
from games.tests.factories.game import GameFactory
from games.tests.factories.user import UserFactory


class PollFactory(factory.django.DjangoModelFactory):
    """Factory for Poll."""

    class Meta:
        """Factory configuration."""

        model = Poll

    game = factory.SubFactory(GameFactory)
    type = Poll.TYPE_SINGLE
    status = Poll.STATUS_OPEN


class PollOptionFactory(factory.django.DjangoModelFactory):
    """Factory for PollOption."""

    class Meta:
        """Factory configuration."""

        model = PollOption

    poll = factory.SubFactory(PollFactory)
    option = 'Test Option'


class PollVoteFactory(factory.django.DjangoModelFactory):
    """Factory for PollVote.

    `user` and `option` are independent sub-factories with no shared game by
    default, so `PollVote.clean()`'s game-membership check will fail unless the
    caller explicitly makes the user a player or game master of the poll's game
    (e.g. `player.game = poll.game; player.save()`) before building a valid vote.
    """

    class Meta:
        """Factory configuration."""

        model = PollVote

    user = factory.SubFactory(UserFactory)
    option = factory.SubFactory(PollOptionFactory)
