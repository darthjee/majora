"""Factory Boy factories for building `domains` app model instances in tests."""

from domains.tests.factories.domain import DomainFactory, DomainGroupFactory

__all__ = [
    'DomainFactory',
    'DomainGroupFactory',
]
