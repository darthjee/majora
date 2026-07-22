"""Shared route-building helper for the parallel PC/NPC `urls.py` modules."""

from django.urls import path

_CHARACTER_ROUTES = [
    ('.json', 'detail'),
    ('/full.json', 'full'),
    ('/money.json', 'money'),
    ('/photos.json', 'photos'),
    ('/access.json', 'access'),
    ('/permissions.json', 'permissions'),
    ('/photo_upload.json', 'photo_upload'),
    ('/photos/<int:photo_id>/set.json', 'photo_set'),
    ('/documents.json', 'documents'),
    ('/documents/all.json', 'documents_all'),
    ('/items.json', 'items'),
    ('/items/all.json', 'items_all'),
    ('/items/<int:item_id>.json', 'item_detail'),
    ('/items/<int:item_id>/full.json', 'item_detail_full'),
    ('/items/<int:item_id>/photo_upload.json', 'item_photo_upload'),
    ('/treasures.json', 'treasures'),
    ('/treasures/acquire.json', 'treasure_acquire'),
    ('/treasures/acquire/all.json', 'treasure_acquire_all'),
    ('/treasures/sell.json', 'treasure_sell'),
]


def build_character_urlpatterns(kind, views, extra_routes=()):
    """Return the character-id-scoped URL patterns shared by a game's PCs and NPCs.

    `kind` is `'pc'` or `'npc'`; `views` is the shared `game.views` module. Each route's
    view is resolved as `views.game_<kind>_<name_suffix>`, and its name as
    `game-<kind>-<name_suffix-with-dashes>`. `extra_routes` appends any `(path_suffix,
    name_suffix)` routes with no counterpart on the other side (e.g. the NPC-only
    `treasures/all.json`), scoped to the same `<int:character_id>` prefix.
    """
    return [
        _character_route(kind, views, path_suffix, name_suffix)
        for path_suffix, name_suffix in (*_CHARACTER_ROUTES, *extra_routes)
    ]


def _character_route(kind, views, path_suffix, name_suffix):
    """Return a single character-id-scoped `path()` entry for `name_suffix`."""
    return path(
        f'games/<slug:game_slug>/{kind}s/<int:character_id>{path_suffix}',
        getattr(views, f'game_{kind}_{name_suffix}'),
        name=f'game-{kind}-{name_suffix.replace("_", "-")}',
    )
