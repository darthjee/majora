"""Factories for `DomainGroup` and `Domain`."""

import factory

from domains.models import Domain, DomainGroup


class DomainGroupFactory(factory.django.DjangoModelFactory):
    """Factory for DomainGroup."""

    class Meta:
        """Factory configuration."""

        model = DomainGroup

    name = 'Test Domain Group'


class DomainFactory(factory.django.DjangoModelFactory):
    """Factory for Domain."""

    class Meta:
        """Factory configuration."""

        model = Domain

    domain = factory.Sequence(lambda n: f'example{n}.com')
    domain_group = factory.SubFactory(DomainGroupFactory)
    schemes = 'https'
