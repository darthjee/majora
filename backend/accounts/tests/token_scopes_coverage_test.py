"""Coverage test: every DRF view declares `@token_scopes`, is excluded, or is pending."""

from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.views import APIView

from accounts.authentication import is_excluded_route
from games.decorators import get_token_scopes

IGNORED_METHODS = frozenset({'options', 'head'})

# TEMPORARY: URL names of views that do not declare `@token_scopes` yet. Scoped tokens get
# 403 `token_not_allowed` on them (fail closed). Each sub-issue (#1630-#1639) declares its
# family's views and removes them from this set; the last one deletes the set.
PENDING_TOKEN_SCOPES = frozenset(
    {
        'game-photo-upload',
        'game-photos',
        'miniatures-collections-detail',
        'miniatures-collections-import',
        'miniatures-collections-list',
        'miniatures-collections-photo-upload',
        'miniatures-detail',
        'miniatures-import',
        'miniatures-list',
        'miniatures-photo-upload',
        'miniatures-sources-detail',
        'miniatures-sources-list',
        'miniatures-sources-photo-upload',
        'permissions-game-document',
        'permissions-game-npc',
        'permissions-game-pc',
        'upload-finalize',
    }
)


class RouteEntry:
    """One URL pattern resolved to a full route, with its DRF view facts."""

    def __init__(self, route, pattern):
        """Keep the full `route` and the `URLPattern` it ends in."""
        self.route = route
        self.name = pattern.name or route
        self.callback = pattern.callback
        self.view_class = getattr(pattern.callback, 'cls', None)

    def is_drf_view(self):
        """Return whether the callback is a DRF `APIView`."""
        return isinstance(self.view_class, type) and issubclass(self.view_class, APIView)

    def served_methods(self):
        """Return the upper-case HTTP methods the view serves, ignoring OPTIONS and HEAD."""
        return {
            method.upper()
            for method in self.view_class.http_method_names
            if method not in IGNORED_METHODS and hasattr(self.view_class, method)
        }

    def is_excluded(self):
        """Return whether the route is excluded or the view ignores every credential."""
        return is_excluded_route(self.route) or self.view_class.authentication_classes == []

    def declared_methods(self):
        """Return the methods the view declares with `@token_scopes` (empty when undeclared)."""
        return set(get_token_scopes(self.callback) or ())

    def is_covered(self):
        """Return whether every served method is declared."""
        return self.served_methods() <= self.declared_methods()


class UrlWalker:
    """Flatten the project URL configuration into `RouteEntry` objects for DRF views."""

    def entries(self):
        """Return every DRF `RouteEntry` in the root URL configuration."""
        entries = self._walk(get_resolver().url_patterns, '')
        return [entry for entry in entries if entry.is_drf_view()]

    def _walk(self, patterns, prefix):
        """Yield a `RouteEntry` for each `URLPattern` below `patterns`."""
        for pattern in patterns:
            route = prefix + str(pattern.pattern)
            if isinstance(pattern, URLResolver):
                yield from self._walk(pattern.url_patterns, route)
            elif isinstance(pattern, URLPattern):
                yield RouteEntry(route, pattern)


class TestTokenScopesCoverage:
    """Every DRF view declares `@token_scopes` for each method, is excluded, or is pending."""

    def setup_method(self):
        """Walk the URL configuration once per test."""
        self.entries = UrlWalker().entries()

    def test_finds_drf_views(self):
        """The walk reaches the project's DRF views."""
        assert len(self.entries) > 100

    def test_every_view_is_declared_excluded_or_pending(self):
        """No DRF view serves a method without a declaration, unless excluded or pending."""
        uncovered = [entry.route for entry in self.entries if not self._is_accounted_for(entry)]
        assert uncovered == []

    def _is_accounted_for(self, entry):
        """Return whether `entry` is excluded, fully declared, or pending."""
        return entry.is_excluded() or entry.is_covered() or entry.name in PENDING_TOKEN_SCOPES

    def test_pending_entries_exist(self):
        """Every pending name still names a DRF view."""
        names = {entry.name for entry in self.entries}
        assert sorted(PENDING_TOKEN_SCOPES - names) == []

    def test_pending_entries_are_not_covered_or_excluded(self):
        """A view that is declared or excluded must leave the pending set."""
        stale = [
            entry.name
            for entry in self.entries
            if entry.name in PENDING_TOKEN_SCOPES and (entry.is_covered() or entry.is_excluded())
        ]
        assert stale == []
