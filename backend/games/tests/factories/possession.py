"""Factory for `GamePossession`."""

import factory

from games.models import GamePossession
from games.tests.factories.game import GameFactory


class GamePossessionFactory(factory.django.DjangoModelFactory):
    """Factory for GamePossession."""

    class Meta:
        """Factory configuration."""

        model = GamePossession

    game = factory.SubFactory(GameFactory)
    name = 'Test Possession'
    description = 'A test possession.'
