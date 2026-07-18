"""URL patterns for a game's Player Characters (PCs)."""

from django.urls import path

from .. import views

urlpatterns = [
    path('games/<slug:game_slug>/pcs.json', views.game_pcs, name='game-pcs'),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>.json',
        views.game_pc_detail,
        name='game-pc-detail',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/full.json',
        views.game_pc_full,
        name='game-pc-full',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/money.json',
        views.game_pc_money,
        name='game-pc-money',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/photos.json',
        views.game_pc_photos,
        name='game-pc-photos',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/access.json',
        views.game_pc_access,
        name='game-pc-access',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/permissions.json',
        views.game_pc_permissions,
        name='game-pc-permissions',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/photo_upload.json',
        views.game_pc_photo_upload,
        name='game-pc-photo-upload',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/photos/<int:photo_id>/set.json',
        views.game_pc_photo_set,
        name='game-pc-photo-set',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/items.json',
        views.game_pc_items,
        name='game-pc-items',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/items/all.json',
        views.game_pc_items_all,
        name='game-pc-items-all',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/treasures.json',
        views.game_pc_treasures,
        name='game-pc-treasures',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/treasures/acquire.json',
        views.game_pc_treasure_acquire,
        name='game-pc-treasure-acquire',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/treasures/acquire/all.json',
        views.game_pc_treasure_acquire_all,
        name='game-pc-treasure-acquire-all',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/treasures/sell.json',
        views.game_pc_treasure_sell,
        name='game-pc-treasure-sell',
    ),
]
