"""Management command listing registered backend routes with no matching frontend usage.

See issue #1030: this command reuses Django's own URL resolver to enumerate every registered
route, cross-references it against how the frontend actually calls endpoints (hardcoded client
paths and `resourceConfig.js`-driven paths), and prints the routes with no matching usage. Its
output is a candidate list for humans to review, not a final verdict — see
`docs/agents/unused-endpoints.md`.
"""

import re
from pathlib import Path
from typing import NamedTuple

from django.conf import settings
from django.core.management.base import BaseCommand
from django.urls import get_resolver
from django.urls.resolvers import URLResolver

_DYNAMIC_SEGMENT_MARKERS = (
    re.compile(r'<[^/>]+>'),  # Django path converter: <converter:name> or <name>
    re.compile(r'\(\?P<\w+>'),  # Regex named group opening: (?P<name>
    re.compile(r'\$\{[^{}]*\}'),  # JS template interpolation: ${expr}
)

_FRONTEND_PATH_RE = re.compile(
    r"""(?<=[`'"])/(?:[\w\-.]+|\$\{[^{}]*\})(?:/(?:[\w\-.]+|\$\{[^{}]*\}))*"""
)


class Route(NamedTuple):
    """A single registered backend URL route."""

    path: str
    methods: tuple
    module: str


class PathNormalizer:
    """Normalizes a raw Django or frontend path template into a wildcard-comparable form."""

    WILDCARD = '*'

    def normalize(self, raw_path):
        """Return `raw_path` as a tuple of segments, dynamic ones collapsed to `WILDCARD`."""
        body = self._strip_regex_anchors(raw_path)
        segments = [segment for segment in body.split('/') if segment]
        return tuple(self._normalize_segment(segment) for segment in segments)

    def display(self, raw_path):
        """Return `raw_path` cleaned up for humans: anchors stripped, regex escapes undone."""
        return self._unescape(self._strip_regex_anchors(raw_path))

    def _strip_regex_anchors(self, raw_path):
        """Strip the `^`/`$` regex anchors a `re_path` pattern wraps its route body in."""
        return raw_path.removeprefix('^').removesuffix('$')

    def _normalize_segment(self, segment):
        """Return `segment` lowercased, or `WILDCARD` if it contains any dynamic part."""
        if any(marker.search(segment) for marker in _DYNAMIC_SEGMENT_MARKERS):
            return self.WILDCARD
        return self._unescape(segment).lower()

    def _unescape(self, segment):
        """Undo regex backslash-escaping (e.g. `\\.` -> `.`) left over from a `re_path` pattern."""
        return re.sub(r'\\(.)', r'\1', segment)


class RouteMatcher:
    """Checks whether a route's normalized path structurally matches a used path."""

    def __init__(self, normalizer):
        """Store the `PathNormalizer` used to bring both sides into a comparable form."""
        self._normalizer = normalizer

    def is_used(self, route, used_paths):
        """Return whether `route`'s path matches any of the normalized `used_paths`."""
        candidate = self._normalizer.normalize(route.path)
        return any(self._segments_match(candidate, used) for used in used_paths)

    def _segments_match(self, candidate, used):
        """Return whether two equal-length segment tuples match, wildcards matching anything."""
        if len(candidate) != len(used):
            return False
        return all(self._segment_matches(a, b) for a, b in zip(candidate, used))

    def _segment_matches(self, left, right):
        """Return whether two segments match: equal, or either one is the wildcard token."""
        wildcard = self._normalizer.WILDCARD
        return left == right or left == wildcard or right == wildcard


class RouteCollector:
    """Collects every registered route from a Django URL resolver, excluding `/admin/`."""

    ADMIN_PREFIX = 'admin/'

    def __init__(self, resolver):
        """Store the root `URLResolver` (e.g. `django.urls.get_resolver()`) to walk."""
        self._resolver = resolver

    def collect(self):
        """Return every `Route` reachable from the resolver, admin routes excluded."""
        return [
            route for route in self._walk(self._resolver, '')
            if not route.path.startswith(self.ADMIN_PREFIX)
        ]

    def _walk(self, resolver, prefix):
        """Recursively walk `resolver`'s patterns, returning a flat list of `Route`s."""
        routes = []
        for entry in resolver.url_patterns:
            routes.extend(self._collect_entry(entry, prefix))
        return routes

    def _collect_entry(self, entry, prefix):
        """Return the `Route`(s) from one resolver entry (leaf pattern or nested sub-resolver)."""
        full_pattern = prefix + str(entry.pattern)
        if isinstance(entry, URLResolver):
            return self._walk(entry, full_pattern)
        return [self._build_route(entry, full_pattern)]

    def _build_route(self, url_pattern, full_pattern):
        """Build a `Route` from a leaf `URLPattern` and its fully-prefixed path string."""
        callback = url_pattern.callback
        return Route(
            path=full_pattern,
            methods=self._methods_for(callback),
            module=callback.__module__,
        )

    def _methods_for(self, callback):
        """Return the sorted HTTP methods a DRF `@api_view` callback allows (`OPTIONS` excluded)."""
        view_class = getattr(callback, 'cls', None)
        method_names = getattr(view_class, 'http_method_names', [])
        return tuple(
            sorted(name.upper() for name in method_names if name not in ('options', 'head'))
        )


class FrontendUsageCollector:
    """Reads frontend source as plain text and collects every path template it declares."""

    def __init__(self, frontend_root, normalizer):
        """Store the frontend source root and the `PathNormalizer` used to normalize matches."""
        self._frontend_root = Path(frontend_root)
        self._normalizer = normalizer

    def collect(self):
        """Return the set of normalized path templates declared across the frontend source."""
        used_paths = set()
        for file_path in self._source_files():
            used_paths.update(self._paths_in(file_path))
        return used_paths

    def _source_files(self):
        """Return every frontend `.js` file to scan: per-resource clients and request config."""
        requests_dir = self._frontend_root / 'assets' / 'js' / 'utils' / 'requests'
        client_dir = self._frontend_root / 'assets' / 'js' / 'client'
        return (
            sorted(client_dir.glob('*.js'))
            + [requests_dir / 'resourceConfig.js']
            + sorted((requests_dir / 'config').glob('*.js'))
        )

    def _paths_in(self, file_path):
        """Return the normalized path templates found as string/template literals in a file."""
        if not file_path.exists():
            return set()
        text = file_path.read_text(encoding='utf-8')
        return {self._normalizer.normalize(match) for match in _FRONTEND_PATH_RE.findall(text)}


class UnusedEndpointsFinder:
    """Diffs registered routes against frontend-used paths to find unused candidates."""

    def __init__(self, matcher):
        """Store the `RouteMatcher` used to decide whether a route has matching frontend usage."""
        self._matcher = matcher

    def find(self, routes, used_paths):
        """Return the routes among `routes` whose path matches none of `used_paths`."""
        return [route for route in routes if not self._matcher.is_used(route, used_paths)]


class Command(BaseCommand):
    """Print every registered backend route with no matching frontend usage."""

    help = (
        'List backend routes registered in majora_project.urls with no matching usage in the '
        'frontend client/resourceConfig source (candidates for docs/agents/unused-endpoints.md).'
    )

    def add_arguments(self, parser):
        """Register the `--frontend-root` override, used by tests and non-default layouts."""
        parser.add_argument(
            '--frontend-root',
            dest='frontend_root',
            default=None,
            help='Path to the frontend source root (default: a `frontend/` sibling of `backend/`).',
        )

    def handle(self, *args, **options):
        """Print each unused route as `<methods> <path> (<module>)`, one per line."""
        normalizer = PathNormalizer()
        for route in self._unused_routes(normalizer, options['frontend_root']):
            self.stdout.write(self._format(normalizer, route))

    def _unused_routes(self, normalizer, frontend_root):
        """Return the unused `Route`s for `frontend_root`, sorted by path for stable output."""
        routes = RouteCollector(get_resolver()).collect()
        used_paths = FrontendUsageCollector(
            frontend_root or self._default_frontend_root(), normalizer,
        ).collect()
        finder = UnusedEndpointsFinder(RouteMatcher(normalizer))
        return sorted(finder.find(routes, used_paths), key=lambda route: route.path)

    def _default_frontend_root(self):
        """Return the default frontend source root: the `frontend/` sibling of `BASE_DIR`."""
        return Path(settings.BASE_DIR) / '..' / 'frontend'

    def _format(self, normalizer, route):
        """Format a single `Route` as one printable output line, with a human-readable path."""
        methods = ','.join(route.methods)
        path = normalizer.display(route.path)
        return f'{methods} {path} ({route.module})'
