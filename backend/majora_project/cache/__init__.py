"""In-process memory cache module: a single, process-wide store shared across all apps.

There is no Redis instance available in this environment, so this module provides a
size-bounded, LRU-evicting, in-process substitute. It is deliberately app-agnostic (see
`majora_project.env`'s `env_int` for a similar shared, project-wide helper) so it can be
reused by any Django app for any kind of cacheable data, not just the `games` app's
permission checks that consume it first.
"""

from .base import MemoryCache

memory_cache = MemoryCache()

__all__ = ['MemoryCache', 'memory_cache']
