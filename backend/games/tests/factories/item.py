"""Factories for `GameItem` and `CharacterItem`."""

import factory

from games.models import CharacterItem, GameItem
from games.tests.factories.character import CharacterFactory
from games.tests.factories.game import GameFactory


class GameItemFactory(factory.django.DjangoModelFactory):
    """Factory for GameItem."""

    class Meta:
        """Factory configuration."""

        model = GameItem

    game = factory.SubFactory(GameFactory)
    name = 'Test Item'
    description = 'A test item.'


class CharacterItemFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterItem."""

    class Meta:
        """Factory configuration."""

        model = CharacterItem

    character = factory.SubFactory(CharacterFactory)
    game_item = factory.SubFactory(GameItemFactory)
