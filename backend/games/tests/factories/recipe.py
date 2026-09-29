"""Factory for `GameRecipe`."""

import factory

from games.models import GameRecipe
from games.tests.factories.common_item import GameCommonItemFactory
from games.tests.factories.game import GameFactory


class GameRecipeFactory(factory.django.DjangoModelFactory):
    """Factory for GameRecipe."""

    class Meta:
        """Factory configuration."""

        model = GameRecipe

    game = factory.SubFactory(GameFactory)
    name = 'Test Recipe'
    game_common_item = factory.SubFactory(
        GameCommonItemFactory, game=factory.SelfAttribute('..game'),
    )
