"""Factory for `GameCommonItem`."""

import factory

from games.models import GameCommonItem
from games.tests.factories.game import GameFactory


class GameCommonItemFactory(factory.django.DjangoModelFactory):
    """Factory for GameCommonItem."""

    class Meta:
        """Factory configuration."""

        model = GameCommonItem

    game = factory.SubFactory(GameFactory)
    name = 'Test Common Item'
    price = 10
    description = 'A test common item.'
