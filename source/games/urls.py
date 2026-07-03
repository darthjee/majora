"""URL patterns for the games app."""

from django.urls import path

from . import views

urlpatterns = [
    path('games.json', views.games_list, name='games-list'),
    path('games/<slug:game_slug>.json', views.game_detail, name='game-detail'),
    path('games/<slug:game_slug>/access.json', views.game_access, name='game-access'),
    path('games/<slug:game_slug>/pcs.json', views.game_pcs, name='game-pcs'),
    path('games/<slug:game_slug>/npcs.json', views.game_npcs, name='game-npcs'),
    path('games/<slug:game_slug>/treasures.json', views.game_treasures, name='game-treasures'),
    path('games/<slug:game_slug>/npcs/all.json', views.game_npcs_all, name='game-npcs-all'),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>.json',
        views.game_npc_detail,
        name='game-npc-detail',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>.json',
        views.game_pc_detail,
        name='game-pc-detail',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/full.json',
        views.game_npc_full,
        name='game-npc-full',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/full.json',
        views.game_pc_full,
        name='game-pc-full',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/access.json',
        views.game_pc_access,
        name='game-pc-access',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/access.json',
        views.game_npc_access,
        name='game-npc-access',
    ),
    path(
        'games/<slug:game_slug>/pcs/<int:character_id>/photo_upload.json',
        views.game_pc_photo_upload,
        name='game-pc-photo-upload',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/photo_upload.json',
        views.game_npc_photo_upload,
        name='game-npc-photo-upload',
    ),
    path(
        'games/<slug:game_slug>/game-masters.json',
        views.game_masters_list,
        name='game-masters-list',
    ),
    path(
        'games/<slug:game_slug>/game-masters/<int:game_master_id>.json',
        views.game_master_detail,
        name='game-master-detail',
    ),
    path(
        'games/<slug:game_slug>/photo_upload.json',
        views.photo_upload,
        name='game-photo-upload',
    ),
    path('treasures.json', views.treasures_list, name='treasures-list'),
    path('treasures/<int:treasure_id>.json', views.treasure_detail, name='treasure-detail'),
    path('treasures/<int:treasure_id>/access.json', views.treasure_access, name='treasure-access'),
    path('uploads/<int:upload_id>.json', views.upload_finalize, name='upload-finalize'),
    path('users/login.json', views.login, name='users-login'),
    path('users/logout.json', views.logout, name='users-logout'),
    path('users/register.json', views.register, name='users-register'),
    path('users/status.json', views.status, name='users-status'),
    path('users/test-email.json', views.test_email, name='users-test-email'),
    path('users/recover.json', views.recover, name='users-recover'),
    path('users/reset-password.json', views.reset_password, name='users-reset-password'),
    path('users/language.json', views.language, name='users-language'),
    path('health.json', views.health, name='health'),
]
