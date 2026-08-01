"""Factories for `Treasure` and `GameTreasure`."""

import factory

from games.models import GameTreasure, Treasure
from games.tests.factories.game import GameFactory


class TreasureFactory(factory.django.DjangoModelFactory):
    """Factory for Treasure."""

    class Meta:
        """Factory configuration."""

        model = Treasure

    name = 'Test Treasure'
    value = 100


class GameTreasureFactory(factory.django.DjangoModelFactory):
    """Factory for GameTreasure, defaulting value to its linked treasure's value."""

    class Meta:
        """Factory configuration."""

        model = GameTreasure

    game = factory.SubFactory(GameFactory)
    treasure = factory.SubFactory(TreasureFactory)
    value = factory.LazyAttribute(lambda o: o.treasure.value)
    hidden = False
