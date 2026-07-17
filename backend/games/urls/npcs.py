"""URL patterns for a game's Non-Player Characters (NPCs)."""

from django.urls import path

from .. import views

urlpatterns = [
    path('games/<slug:game_slug>/npcs.json', views.game_npcs, name='game-npcs'),
    path('games/<slug:game_slug>/npcs/all.json', views.game_npcs_all, name='game-npcs-all'),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>.json',
        views.game_npc_detail,
        name='game-npc-detail',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/full.json',
        views.game_npc_full,
        name='game-npc-full',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/money.json',
        views.game_npc_money,
        name='game-npc-money',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/photos.json',
        views.game_npc_photos,
        name='game-npc-photos',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/access.json',
        views.game_npc_access,
        name='game-npc-access',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/permissions.json',
        views.game_npc_permissions,
        name='game-npc-permissions',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/photo_upload.json',
        views.game_npc_photo_upload,
        name='game-npc-photo-upload',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/photos/<int:photo_id>/set.json',
        views.game_npc_photo_set,
        name='game-npc-photo-set',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/treasures.json',
        views.game_npc_treasures,
        name='game-npc-treasures',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/treasures/all.json',
        views.game_npc_treasures_all,
        name='game-npc-treasures-all',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/treasures/acquire.json',
        views.game_npc_treasure_acquire,
        name='game-npc-treasure-acquire',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/treasures/acquire/all.json',
        views.game_npc_treasure_acquire_all,
        name='game-npc-treasure-acquire-all',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/treasures/sell.json',
        views.game_npc_treasure_sell,
        name='game-npc-treasure-sell',
    ),
]
