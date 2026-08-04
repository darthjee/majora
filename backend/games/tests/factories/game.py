"""Factories for `Game` and `Player`."""

import factory

from games.models import Game, Player


class GameFactory(factory.django.DjangoModelFactory):
    """Factory for Game."""

    class Meta:
        """Factory configuration."""

        model = Game
        skip_postgeneration_save = True

    name = 'Test Game'
    game_slug = factory.Sequence(lambda n: 'test-game' if n == 0 else f'test-game-{n}')

    @factory.post_generation
    def game_domain_groups(self, create, extracted, **kwargs):
        """Attach any GameDomainGroups passed at construction time."""
        if not create or not extracted:
            return
        self.game_domain_groups.set(extracted)


class PlayerFactory(factory.django.DjangoModelFactory):
    """Factory for Player."""

    class Meta:
        """Factory configuration."""

        model = Player

    name = 'Test Player'
    game = factory.SubFactory(GameFactory)
