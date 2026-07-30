"""In-memory loader/cache for the permissions YAML config files."""

import copy
import os

import yaml

_CONFIG_ROOT = os.path.join(os.path.dirname(__file__), 'config')


class PermissionConfigStore:
    """Parse and cache the small, fixed set of permissions YAML config files.

    Keeps its own plain in-class dict rather than routing through `MemoryCache`
    (`majora_project.cache.MemoryCache`): the set of resource/type YAML files is small and
    fixed, known at review time, and never needs eviction, unlike `MemoryCache`'s per-user/
    per-game entries — going through it would risk an unrelated eviction forcing a needless
    re-parse, for no real benefit here.
    """

    _cache = {}

    @classmethod
    def get(cls, resource, permission_type):
        """Return a deep copy of the parsed YAML config for `resource`/`permission_type`.

        `permission_type` is `'endpoints'` or `'ui'`. Loads from
        `config/<resource>/<permission_type>.yml` on first request, caching the parsed
        result in memory; every call returns a fresh copy so callers can't mutate the
        cached original.
        """
        key = (resource, permission_type)
        if key not in cls._cache:
            cls._cache[key] = cls._load(resource, permission_type)
        return copy.deepcopy(cls._cache[key])

    @classmethod
    def _load(cls, resource, permission_type):
        """Read and parse `config/<resource>/<permission_type>.yml`, defaulting to `{}`."""
        path = os.path.join(_CONFIG_ROOT, resource, f'{permission_type}.yml')
        with open(path) as config_file:
            return yaml.safe_load(config_file) or {}
