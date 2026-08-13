"""Shared route-building helper for the parallel PC/NPC `urls.py` modules."""

from django.urls import path

_CHARACTER_ROUTES = [
    ('.json', 'detail'),
    ('/full.json', 'full'),
    ('/photos.json', 'photos'),
    ('/access.json', 'access'),
    ('/photo_upload.json', 'photo_upload'),
    ('/photos/<int:photo_id>/set.json', 'photo_set'),
    ('/photos/<int:photo_id>.json', 'photo_detail'),
    ('/photos/<int:photo_id>/deletable.json', 'photo_deletable'),
    ('/documents.json', 'documents'),
    ('/documents/all.json', 'documents_all'),
    ('/documents/<int:document_id>.json', 'document_detail'),
    ('/documents/<int:document_id>/full.json', 'document_detail_full'),
    ('/documents/<int:document_id>/files.json', 'document_files'),
    ('/documents/<int:document_id>/files/all.json', 'document_files_all'),
    ('/documents/<int:document_id>/photos.json', 'document_photos'),
    ('/documents/<int:document_id>/photos/all.json', 'document_photos_all'),
    ('/documents/available.json', 'documents_available'),
    ('/documents/available/all.json', 'documents_available_all'),
    ('/documents/acquire.json', 'document_acquire'),
    ('/documents/acquire/all.json', 'document_acquire_all'),
    ('/documents/remove.json', 'document_remove'),
    ('/documents/remove/all.json', 'document_remove_all'),
    ('/items.json', 'items'),
    ('/items/all.json', 'items_all'),
    ('/items/<int:item_id>.json', 'item_detail'),
    ('/items/<int:item_id>/full.json', 'item_detail_full'),
    ('/items/<int:item_id>/photo_upload.json', 'item_photo_upload'),
    ('/items/available.json', 'items_available'),
    ('/items/available/all.json', 'items_available_all'),
    ('/items/acquire.json', 'item_acquire'),
    ('/items/acquire/all.json', 'item_acquire_all'),
    ('/items/remove.json', 'item_remove'),
    ('/items/remove/all.json', 'item_remove_all'),
    ('/possessions.json', 'possessions'),
    ('/possessions/all.json', 'possessions_all'),
    ('/possessions/<int:possession_id>.json', 'possession_detail'),
    ('/possessions/<int:possession_id>/full.json', 'possession_detail_full'),
    ('/possessions/available.json', 'possessions_available'),
    ('/possessions/available/all.json', 'possessions_available_all'),
    ('/possessions/acquire.json', 'possession_acquire'),
    ('/possessions/acquire/all.json', 'possession_acquire_all'),
    ('/possessions/remove.json', 'possession_remove'),
    ('/possessions/remove/all.json', 'possession_remove_all'),
    ('/treasures.json', 'treasures'),
    ('/treasures/buy.json', 'treasure_buy'),
    ('/treasures/buy/all.json', 'treasure_buy_all'),
    ('/treasures/sell.json', 'treasure_sell'),
    ('/treasures/acquire.json', 'treasure_acquire'),
    ('/treasures/acquire/all.json', 'treasure_acquire_all'),
    ('/treasures/remove.json', 'treasure_remove'),
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
