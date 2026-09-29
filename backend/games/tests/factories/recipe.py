"""Factories for `GameRecipe` and `CharacterRecipe`."""

import factory

from games.models import CharacterRecipe, GameRecipe
from games.tests.factories.character import CharacterFactory
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


class CharacterRecipeFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterRecipe."""

    class Meta:
        """Factory configuration."""

        model = CharacterRecipe

    character = factory.SubFactory(CharacterFactory)
    game_recipe = factory.SubFactory(
        GameRecipeFactory, game=factory.SelfAttribute('..character.game'),
    )
