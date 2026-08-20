"""Factory for `DomainConfiguration`."""

import factory

from domains.models import DomainConfiguration

from .domain import DomainGroupFactory


class DomainConfigurationFactory(factory.django.DjangoModelFactory):
    """Factory for DomainConfiguration."""

    class Meta:
        """Factory configuration."""

        model = DomainConfiguration

    domain_group = factory.SubFactory(DomainGroupFactory)
