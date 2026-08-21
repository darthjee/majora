"""URL patterns for the entity-agnostic `/permissions/*.json` endpoints (issue #926).

Each route is keyed only by entity type — no path parameters — since the response depends
only on the entity type and the `?role=` query params, never on a specific instance (see
`games/views/permissions/`).
"""

from django.urls import path

from ..views.permissions import (
    game_common_item_permissions,
    game_document_permissions,
    game_faction_permissions,
    game_item_permissions,
    game_npc_permissions,
    game_pc_permissions,
    game_permissions,
    game_possession_permissions,
    game_treasure_permissions,
    treasure_permissions,
)

urlpatterns = [
    path('permissions/game.json', game_permissions, name='permissions-game'),
    path('permissions/treasure.json', treasure_permissions, name='permissions-treasure'),
    path(
        'permissions/game_treasure.json',
        game_treasure_permissions,
        name='permissions-game-treasure',
    ),
    path('permissions/game_pc.json', game_pc_permissions, name='permissions-game-pc'),
    path('permissions/game_npc.json', game_npc_permissions, name='permissions-game-npc'),
    path(
        'permissions/game_possession.json',
        game_possession_permissions,
        name='permissions-game-possession',
    ),
    path(
        'permissions/game_common_item.json',
        game_common_item_permissions,
        name='permissions-game-common-item',
    ),
    path('permissions/game_item.json', game_item_permissions, name='permissions-game-item'),
    path(
        'permissions/game_faction.json',
        game_faction_permissions,
        name='permissions-game-faction',
    ),
    path(
        'permissions/game_document.json',
        game_document_permissions,
        name='permissions-game-document',
    ),
]
