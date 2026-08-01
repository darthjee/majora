"""Factories for `GameDocument` and `CharacterDocument`."""

import factory

from games.models import CharacterDocument, GameDocument
from games.tests.factories.character import CharacterFactory
from games.tests.factories.game import GameFactory


class GameDocumentFactory(factory.django.DjangoModelFactory):
    """Factory for GameDocument."""

    class Meta:
        """Factory configuration."""

        model = GameDocument

    game = factory.SubFactory(GameFactory)
    name = 'Test Document'
    description = 'A test document.'


class CharacterDocumentFactory(factory.django.DjangoModelFactory):
    """Factory for CharacterDocument."""

    class Meta:
        """Factory configuration."""

        model = CharacterDocument

    character = factory.SubFactory(CharacterFactory)
    game_document = factory.SubFactory(GameDocumentFactory)
