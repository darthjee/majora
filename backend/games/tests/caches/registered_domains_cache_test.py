"""Tests for RegisteredDomainsCache."""

import pytest

from domains.tests.factories import DomainFactory
from games.caches import RegisteredDomainsCache
from majora_project.cache import memory_cache


@pytest.mark.django_db
class TestRegisteredDomainsCacheDomains:
    """Tests for RegisteredDomainsCache.domains()."""

    def setup_method(self):
        """Set up two registered domains, and clear the shared memory cache."""
        memory_cache.clear()
        self.first_domain = DomainFactory(domain='first.com')
        self.second_domain = DomainFactory(domain='second.com')

    def test_returns_every_registered_domain(self):
        """Test that every registered Domain.domain is returned."""
        assert RegisteredDomainsCache.domains() == {'first.com', 'second.com'}

    def test_does_not_include_unregistered_domain(self):
        """Test that a domain with no matching Domain is not part of the set."""
        assert 'unknown.com' not in RegisteredDomainsCache.domains()

    def test_serves_from_cache_on_hit_even_after_domains_change(self):
        """Test that a cached result is served without re-checking the live Domain rows."""
        first = RegisteredDomainsCache.domains()

        self.first_domain.delete()
        self.second_domain.delete()

        second = RegisteredDomainsCache.domains()
        assert second == first

    def test_populates_the_cache_type_under_the_key(self):
        """Test that a cache miss stores the result under CACHE_TYPE keyed by 'all'."""
        RegisteredDomainsCache.domains()
        cached = memory_cache.get(RegisteredDomainsCache.CACHE_TYPE, RegisteredDomainsCache._KEY)
        assert cached == {'first.com', 'second.com'}

    def test_cleared_by_memory_cache_clear(self):
        """Test that memory_cache.clear() forces a fresh computation on the next call."""
        RegisteredDomainsCache.domains()

        self.first_domain.delete()
        memory_cache.clear()

        assert RegisteredDomainsCache.domains() == {'second.com'}
