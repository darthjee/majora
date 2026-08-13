"""URL patterns for the entity-agnostic `/permissions/*.json` endpoints (issue #926).

Each route is keyed only by entity type — no path parameters — since the response depends
only on the entity type and the `?role=` query params, never on a specific instance (see
`games/views/permissions/`).
"""

from django.urls import path

from .. import views

urlpatterns = [
    path('permissions/game.json', views.game_permissions, name='permissions-game'),
    path('permissions/treasure.json', views.treasure_permissions, name='permissions-treasure'),
    path(
        'permissions/game_treasure.json',
        views.game_treasure_permissions,
        name='permissions-game-treasure',
    ),
    path('permissions/game_pc.json', views.game_pc_permissions, name='permissions-game-pc'),
    path('permissions/game_npc.json', views.game_npc_permissions, name='permissions-game-npc'),
    path(
        'permissions/game_possession.json',
        views.game_possession_permissions,
        name='permissions-game-possession',
    ),
    path('permissions/game_item.json', views.game_item_permissions, name='permissions-game-item'),
    path(
        'permissions/game_faction.json',
        views.game_faction_permissions,
        name='permissions-game-faction',
    ),
    path(
        'permissions/game_document.json',
        views.game_document_permissions,
        name='permissions-game-document',
    ),
]
