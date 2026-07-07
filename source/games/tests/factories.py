"""Factory Boy factories for building model instances in tests.

These factories are thin, behavior-preserving wrappers around
`Model.objects.create(...)` (and, for users, Django's `create_user`/
`create_superuser`, so passwords stay hashed). Any keyword argument passed to a
factory call overrides its default, so existing test intent (specific names,
roles, flags, etc.) is preserved by passing overrides at the call site.
"""

import factory
from django.contrib.auth.models import User

from games.models import Character, Game, GameMaster, Player, Treasure


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
