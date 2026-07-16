"""Factory Boy factories for building model instances in tests.

These factories are thin, behavior-preserving wrappers around
`Model.objects.create(...)` (and, for users, Django's `create_user`/
`create_superuser`, so passwords stay hashed). Any keyword argument passed to a
factory call overrides its default, so existing test intent (specific names,
roles, flags, etc.) is preserved by passing overrides at the call site.
"""

import factory
from django.contrib.auth.models import User

from games.models import Character, Game, GameMaster, Player, Poll, PollOption, PollVote, Treasure


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for regular Django users, created via `create_user` for password hashing."""

    class Meta:
        """Factory configuration."""

        model = User

    username = factory.Sequence(lambda n: f'user{n}')
    password = 'secret-password'

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create the user through `create_user` so the password is properly hashed."""
        manager = cls._get_manager(model_class)
        return manager.create_user(*args, **kwargs)


class SuperUserFactory(UserFactory):
    """Factory for superusers, created via `create_superuser` for password hashing."""

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Create the user through `create_superuser` so the password is properly hashed."""
        manager = cls._get_manager(model_class)
        return manager.create_superuser(*args, **kwargs)


class GameFactory(factory.django.DjangoModelFactory):
    """Factory for Game."""

    class Meta:
        """Factory configuration."""

        model = Game

    name = 'Test Game'
    game_slug = factory.Sequence(lambda n: 'test-game' if n == 0 else f'test-game-{n}')


class PlayerFactory(factory.django.DjangoModelFactory):
    """Factory for Player."""

    class Meta:
        """Factory configuration."""

        model = Player

    name = 'Test Player'


class CharacterFactory(factory.django.DjangoModelFactory):
    """Factory for Character, defaulting to an NPC (matching the model default)."""

    class Meta:
        """Factory configuration."""

        model = Character

    name = 'Test Character'
    game = factory.SubFactory(GameFactory)
    npc = True


class GameMasterFactory(factory.django.DjangoModelFactory):
    """Factory for GameMaster."""

    class Meta:
        """Factory configuration."""

        model = GameMaster

    game = factory.SubFactory(GameFactory)
    user = factory.SubFactory(UserFactory)


class TreasureFactory(factory.django.DjangoModelFactory):
    """Factory for Treasure."""

    class Meta:
        """Factory configuration."""

        model = Treasure

    name = 'Test Treasure'
    value = 100
    hidden = False


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
    (e.g. `player.games.add(poll.game)`) before building a valid vote.
    """

    class Meta:
        """Factory configuration."""

        model = PollVote

    user = factory.SubFactory(UserFactory)
    option = factory.SubFactory(PollOptionFactory)
