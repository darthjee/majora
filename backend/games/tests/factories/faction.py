"""Factories for `GameFaction` and `CharacterFaction`."""

import factory

from games.models import CharacterFaction, GameFaction
from games.tests.factories.character import CharacterFactory
from games.tests.factories.game import GameFactory


class GameFactionFactory(factory.django.DjangoModelFactory):
    """Factory for GameFaction."""

    class Meta:
        """Factory configuration."""

        model = GameFaction

    game = factory.SubFactory(GameFactory)
    # Sequence, not a fixed string: `GameFaction.name` is unique per game (unlike `GameItem`'s),
    # so multiple factory calls sharing a game must not collide on the default name.
    name = factory.Sequence(lambda n: f'Test Faction {n}')


class CharacterFactionFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterFaction."""

    class Meta:
        """Factory configuration."""

        model = CharacterFaction

    character = factory.SubFactory(CharacterFactory)
    game_faction = factory.SubFactory(GameFactionFactory)
