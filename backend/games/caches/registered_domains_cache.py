"""Cache wrapper resolving the set of every registered `Domain.domain`."""

import sys

from majora_project.cache import memory_cache


class RegisteredDomainsCache:
    """Cache the set of every registered hostname (`Domain.domain`).

    Used alongside `DomainGamesCache` to distinguish an unrecognized domain (not in this
    set) from a recognized domain with zero games (in this set, but `DomainGamesCache`
    resolves it to an empty id list) — both would otherwise look identical.
    """

    CACHE_TYPE = 'registered_domains'
    _KEY = 'all'

    @classmethod
    def domains(cls):
        """Return the cached (or freshly computed) set of every registered `Domain.domain`."""
        cached = memory_cache.get(cls.CACHE_TYPE, cls._KEY)
        if cached is not None:
            return cached
        result = cls._query()
        memory_cache.set(cls.CACHE_TYPE, cls._KEY, result, sys.getsizeof(result))
        return result

    @classmethod
    def _query(cls):
        """Run the underlying database query listing every registered domain."""
        # Imported lazily: `games.caches` is imported by `games.models.character.character`
        # while `games.models` is still being populated, so a module-level import of
        # `Domain` here would trigger a circular import.
        from domains.models import Domain

        return set(Domain.objects.values_list('domain', flat=True))
