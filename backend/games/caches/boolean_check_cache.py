"""Shared plumbing for boolean permission checks cached in the process-wide memory cache."""

import sys

from majora_project.cache import memory_cache


class _BooleanCheckCache:
    """Base helper reading/writing a single cached boolean through the shared memory cache."""

    @staticmethod
    def _get_or_compute(entry_type, key, compute):
        """Return the cached boolean for (`entry_type`, `key`), computing it on a cache miss."""
        cached = memory_cache.get(entry_type, key)
        if cached is not None:
            return cached
        result = compute()
        memory_cache.set(entry_type, key, result, sys.getsizeof(result))
        return result
