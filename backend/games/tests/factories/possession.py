"""Factories for `GamePossession` and `CharacterPossession`."""

import factory

from games.models import CharacterPossession, GamePossession
from games.tests.factories.character import CharacterFactory
from games.tests.factories.game import GameFactory


class GamePossessionFactory(factory.django.DjangoModelFactory):
    """Factory for GamePossession."""

    class Meta:
        """Factory configuration."""

        model = GamePossession

    game = factory.SubFactory(GameFactory)
    name = 'Test Possession'
    description = 'A test possession.'


class CharacterPossessionFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterPossession."""

    class Meta:
        """Factory configuration."""

        model = CharacterPossession

    character = factory.SubFactory(CharacterFactory)
    game_possession = factory.SubFactory(GamePossessionFactory)
