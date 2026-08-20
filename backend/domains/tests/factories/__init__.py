"""Factory Boy factories for building `domains` app model instances in tests."""

from domains.tests.factories.domain import DomainFactory, DomainGroupFactory
from domains.tests.factories.domain_configuration import DomainConfigurationFactory

__all__ = [
    'DomainConfigurationFactory',
    'DomainFactory',
    'DomainGroupFactory',
]
