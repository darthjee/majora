"""In-memory loader/cache for the page-level (endpoint-response) permissions YAML config files."""

import copy
import os

import yaml

_CONFIG_ROOT = os.path.join(os.path.dirname(__file__), 'config', 'pages')


class PagePermissionConfigStore:
    """Parse and cache the small, fixed set of page-level permissions YAML config files.

    Mirrors `PermissionConfigStore`, but for `config/pages/<page_key>.yml` — one file per
    `permissions.json` endpoint response, mapping `resource -> {UIPermission action: response
    key}`, rather than one file per resource's own `ui`/`endpoints` config. Kept as a distinct
    class (rather than folded into `PermissionConfigStore`) since the two live under different
    subtrees and are conceptually different: per-resource config vs per-endpoint-response config.
    """

    _cache = {}

    @classmethod
    def get(cls, page_key):
        """Return a deep copy of the parsed YAML config for `page_key`.

        Loads from `config/pages/<page_key>.yml` on first request, caching the parsed result
        in memory; every call returns a fresh copy so callers can't mutate the cached original.
        """
        if page_key not in cls._cache:
            cls._cache[page_key] = cls._load(page_key)
        return copy.deepcopy(cls._cache[page_key])

    @classmethod
    def _load(cls, page_key):
        """Read and parse `config/pages/<page_key>.yml`, defaulting to `{}`."""
        path = os.path.join(_CONFIG_ROOT, f'{page_key}.yml')
        with open(path) as config_file:
            return yaml.safe_load(config_file) or {}
