"""Cache wrapper resolving `Game` ids reachable through a request's hostname."""

import sys

from majora_project.cache import memory_cache


class DomainGamesCache:
    """Cache the list of `Game` ids available under a hostname's `DomainGroup`.

    Keyed by the lowercased hostname, since `Domain.domain` is normalized to lowercase
    on save. An unrecognized hostname is cached as an empty id list, same as a matched
    `Domain` with zero games, to avoid repeated lookups for bad hosts.
    """

    CACHE_TYPE = 'domain_games'

    @classmethod
    def game_ids_for_domain(cls, domain):
        """Return the cached (or freshly computed) `Game` ids reachable through `domain`."""
        key = domain.lower()
        cached = memory_cache.get(cls.CACHE_TYPE, key)
        if cached is not None:
            return cached
        result = cls._query(key)
        memory_cache.set(cls.CACHE_TYPE, key, result, sys.getsizeof(result))
        return result

    @classmethod
    def game_ids_for_request(cls, request):
        """Return the `Game` ids reachable through `request`'s hostname (port stripped)."""
        host = request.get_host().split(':')[0]
        return cls.game_ids_for_domain(host)

    @classmethod
    def _query(cls, domain):
        """Run the underlying database query resolving `domain` to its games' ids."""
        # Imported lazily: `games.caches` is imported by `games.models.character.character`
        # while `games.models` is still being populated, so a module-level import of `Game`
        # / `Domain` here would trigger a circular import.
        from domains.models import Domain
        from games.models.game.game import Game

        game_domain = Domain.objects.filter(domain=domain).first()
        if game_domain is None:
            return []
        return list(
            Game.objects.filter(game_domain_groups=game_domain.domain_group)
            .values_list('id', flat=True)
        )
