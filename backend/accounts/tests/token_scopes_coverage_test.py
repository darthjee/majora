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
        'game-access',
        'game-common-item-detail',
        'game-common-item-detail-full',
        'game-common-item-photo-upload',
        'game-common-item-recipes',
        'game-common-item-recipes-all',
        'game-common-items',
        'game-common-items-all',
        'game-conversations',
        'game-detail',
        'game-document-detail',
        'game-document-detail-full',
        'game-document-file-photo-upload',
        'game-document-file-upload',
        'game-document-files',
        'game-document-files-all',
        'game-document-npc-summary',
        'game-document-npc-summary-all',
        'game-document-page-detail',
        'game-document-page-detail-all',
        'game-document-pages',
        'game-document-pages-all',
        'game-document-pages-bump-version',
        'game-document-pages-bump-version-all',
        'game-document-pc-summary',
        'game-document-pc-summary-all',
        'game-document-photo-set',
        'game-document-photo-upload',
        'game-document-photos',
        'game-document-photos-all',
        'game-documents',
        'game-documents-all',
        'game-faction-characters',
        'game-faction-characters-all',
        'game-faction-detail',
        'game-faction-npc-summary',
        'game-faction-npc-summary-all',
        'game-faction-pc-summary',
        'game-faction-pc-summary-all',
        'game-faction-photo-upload',
        'game-factions',
        'game-item-detail',
        'game-item-detail-full',
        'game-item-npc-summary',
        'game-item-npc-summary-all',
        'game-item-pc-summary',
        'game-item-pc-summary-all',
        'game-item-photo-upload',
        'game-items',
        'game-items-all',
        'game-npc-access',
        'game-npc-detail',
        'game-npc-document-acquire',
        'game-npc-document-acquire-all',
        'game-npc-document-detail',
        'game-npc-document-detail-full',
        'game-npc-document-files',
        'game-npc-document-files-all',
        'game-npc-document-photos',
        'game-npc-document-photos-all',
        'game-npc-document-remove',
        'game-npc-document-remove-all',
        'game-npc-documents',
        'game-npc-documents-all',
        'game-npc-documents-available',
        'game-npc-documents-available-all',
        'game-npc-faction-acquire',
        'game-npc-faction-acquire-all',
        'game-npc-faction-detail',
        'game-npc-faction-detail-full',
        'game-npc-faction-remove',
        'game-npc-faction-remove-all',
        'game-npc-factions',
        'game-npc-factions-all',
        'game-npc-factions-available',
        'game-npc-factions-available-all',
        'game-npc-full',
        'game-npc-item-acquire',
        'game-npc-item-acquire-all',
        'game-npc-item-detail',
        'game-npc-item-detail-full',
        'game-npc-item-photo-upload',
        'game-npc-item-remove',
        'game-npc-item-remove-all',
        'game-npc-items',
        'game-npc-items-all',
        'game-npc-items-available',
        'game-npc-items-available-all',
        'game-npc-photo-deletable',
        'game-npc-photo-detail',
        'game-npc-photo-set',
        'game-npc-photo-upload',
        'game-npc-photos',
        'game-npc-photos-all',
        'game-npc-possession-acquire',
        'game-npc-possession-acquire-all',
        'game-npc-possession-detail',
        'game-npc-possession-detail-full',
        'game-npc-possession-remove',
        'game-npc-possession-remove-all',
        'game-npc-possessions',
        'game-npc-possessions-all',
        'game-npc-possessions-available',
        'game-npc-possessions-available-all',
        'game-npc-recipe-acquire',
        'game-npc-recipe-acquire-all',
        'game-npc-recipe-detail',
        'game-npc-recipe-detail-full',
        'game-npc-recipe-remove',
        'game-npc-recipe-remove-all',
        'game-npc-recipes',
        'game-npc-recipes-all',
        'game-npc-recipes-available',
        'game-npc-recipes-available-all',
        'game-npc-treasure-acquire',
        'game-npc-treasure-acquire-all',
        'game-npc-treasure-buy',
        'game-npc-treasure-buy-all',
        'game-npc-treasure-remove',
        'game-npc-treasure-sell',
        'game-npc-treasures',
        'game-npc-treasures-all',
        'game-npcs',
        'game-npcs-all',
        'game-npcs-full',
        'game-pc-access',
        'game-pc-detail',
        'game-pc-document-acquire',
        'game-pc-document-acquire-all',
        'game-pc-document-detail',
        'game-pc-document-detail-full',
        'game-pc-document-files',
        'game-pc-document-files-all',
        'game-pc-document-photos',
        'game-pc-document-photos-all',
        'game-pc-document-remove',
        'game-pc-document-remove-all',
        'game-pc-documents',
        'game-pc-documents-all',
        'game-pc-documents-available',
        'game-pc-documents-available-all',
        'game-pc-faction-acquire',
        'game-pc-faction-acquire-all',
        'game-pc-faction-detail',
        'game-pc-faction-detail-full',
        'game-pc-faction-remove',
        'game-pc-faction-remove-all',
        'game-pc-factions',
        'game-pc-factions-all',
        'game-pc-factions-available',
        'game-pc-factions-available-all',
        'game-pc-full',
        'game-pc-item-acquire',
        'game-pc-item-acquire-all',
        'game-pc-item-detail',
        'game-pc-item-detail-full',
        'game-pc-item-photo-upload',
        'game-pc-item-remove',
        'game-pc-item-remove-all',
        'game-pc-items',
        'game-pc-items-all',
        'game-pc-items-available',
        'game-pc-items-available-all',
        'game-pc-photo-deletable',
        'game-pc-photo-detail',
        'game-pc-photo-set',
        'game-pc-photo-upload',
        'game-pc-photos',
        'game-pc-possession-acquire',
        'game-pc-possession-acquire-all',
        'game-pc-possession-detail',
        'game-pc-possession-detail-full',
        'game-pc-possession-remove',
        'game-pc-possession-remove-all',
        'game-pc-possessions',
        'game-pc-possessions-all',
        'game-pc-possessions-available',
        'game-pc-possessions-available-all',
        'game-pc-recipe-acquire',
        'game-pc-recipe-acquire-all',
        'game-pc-recipe-detail',
        'game-pc-recipe-detail-full',
        'game-pc-recipe-remove',
        'game-pc-recipe-remove-all',
        'game-pc-recipes',
        'game-pc-recipes-all',
        'game-pc-recipes-available',
        'game-pc-recipes-available-all',
        'game-pc-treasure-acquire',
        'game-pc-treasure-acquire-all',
        'game-pc-treasure-buy',
        'game-pc-treasure-buy-all',
        'game-pc-treasure-remove',
        'game-pc-treasure-sell',
        'game-pc-treasures',
        'game-pcs',
        'game-photo-upload',
        'game-photos',
        'game-player-detail',
        'game-players',
        'game-poll-close',
        'game-poll-detail',
        'game-poll-votes',
        'game-polls-list',
        'game-possession-detail',
        'game-possession-detail-full',
        'game-possession-photo-upload',
        'game-possessions',
        'game-possessions-all',
        'game-recipe-characters',
        'game-recipe-characters-all',
        'game-recipe-detail',
        'game-recipe-detail-full',
        'game-recipes',
        'game-recipes-all',
        'game-session-detail',
        'game-session-poll-create',
        'game-sessions-future',
        'game-sessions-list',
        'game-sessions-past',
        'game-sessions-unscheduled',
        'game-task-detail',
        'game-tasks-list',
        'game-treasure-detail',
        'game-treasure-full',
        'game-treasure-link',
        'game-treasure-npc-summary',
        'game-treasure-npc-summary-all',
        'game-treasure-pc-summary',
        'game-treasure-pc-summary-all',
        'game-treasures',
        'game-treasures-all',
        'game-treasures-missing',
        'games-list',
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
        'my-games-list',
        'permissions-game',
        'permissions-game-common-item',
        'permissions-game-document',
        'permissions-game-faction',
        'permissions-game-item',
        'permissions-game-npc',
        'permissions-game-pc',
        'permissions-game-possession',
        'permissions-game-recipe',
        'permissions-game-treasure',
        'permissions-treasure',
        'session-messages-list',
        'treasure-access',
        'treasure-detail',
        'treasure-photo-upload',
        'treasures-list',
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
