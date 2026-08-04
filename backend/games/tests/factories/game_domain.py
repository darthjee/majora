"""Factories for `GameDomainGroup` and `GameDomain`."""

import factory

from games.models import GameDomain, GameDomainGroup


class GameDomainGroupFactory(factory.django.DjangoModelFactory):
    """Factory for GameDomainGroup."""

    class Meta:
        """Factory configuration."""

        model = GameDomainGroup

    name = 'Test Domain Group'


class GameDomainFactory(factory.django.DjangoModelFactory):
    """Factory for GameDomain."""

    class Meta:
        """Factory configuration."""

        model = GameDomain

    domain = factory.Sequence(lambda n: f'example{n}.com')
    game_domain_group = factory.SubFactory(GameDomainGroupFactory)
    schemes = 'https'
