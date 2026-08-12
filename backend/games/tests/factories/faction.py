"""Factory for `Faction`."""

import factory

from games.models import Faction
from games.tests.factories.game import GameFactory


class FactionFactory(factory.django.DjangoModelFactory):
    """Factory for Faction."""

    class Meta:
        """Factory configuration."""

        model = Faction

    game = factory.SubFactory(GameFactory)
    # Sequence, not a fixed string: `Faction.name` is unique per game (unlike `GameItem`'s),
    # so multiple factory calls sharing a game must not collide on the default name.
    name = factory.Sequence(lambda n: f'Test Faction {n}')
