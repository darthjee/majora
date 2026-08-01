"""Factory for `Character`."""

import factory

from games.models import Character
from games.tests.factories.game import GameFactory


class CharacterFactory(factory.django.DjangoModelFactory):
    """Factory for Character, defaulting to an NPC (matching the model default)."""

    class Meta:
        """Factory configuration."""

        model = Character

    name = 'Test Character'
    game = factory.SubFactory(GameFactory)
    npc = True
