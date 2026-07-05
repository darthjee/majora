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
    path('games/<slug:game_slug>/photos.json', views.game_photos, name='game-photos'),
    path(
        'games/<slug:game_slug>/sessions.json',
        views.game_sessions_list,
        name='game-sessions-list',
    ),
    path(
        'games/<slug:game_slug>/sessions/<int:session_id>.json',
        views.game_session_detail,
        name='game-session-detail',
    ),
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
        'games/<slug:game_slug>/pcs/<int:character_id>/photos.json',
        views.game_pc_photos,
        name='game-pc-photos',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/photos.json',
        views.game_npc_photos,
        name='game-npc-photos',
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
        'games/<slug:game_slug>/pcs/<int:character_id>/photos/<int:photo_id>/set.json',
        views.game_pc_photo_set,
        name='game-pc-photo-set',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/photos/<int:photo_id>/set.json',
        views.game_npc_photo_set,
        name='game-npc-photo-set',
    ),
    path(
        'games/<slug:game_slug>/npcs/<int:character_id>/slain.json',
        views.game_npc_slain_set,
        name='game-npc-slain-set',
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
    path(
        'treasures/<int:treasure_id>/photo_upload.json',
        views.treasure_photo_upload,
        name='treasure-photo-upload',
    ),
    path('uploads/<int:upload_id>.json', views.upload_finalize, name='upload-finalize'),
    path('staff/users.json', views.staff_users_list, name='staff-users-list'),
    path('staff/users/<int:user_id>.json', views.staff_user_detail, name='staff-user-detail'),
    path(
        'staff/users/<int:user_id>/recovery-link.json',
        views.staff_user_recovery_link,
        name='staff-user-recovery-link',
    ),
    path('users/login.json', views.login, name='users-login'),
    path('users/logout.json', views.logout, name='users-logout'),
    path('users/register.json', views.register, name='users-register'),
    path('users/status.json', views.status, name='users-status'),
    path('users/test-email.json', views.test_email, name='users-test-email'),
    path('users/recover.json', views.recover, name='users-recover'),
    path('users/reset-password.json', views.reset_password, name='users-reset-password'),
    path('users/language.json', views.language, name='users-language'),
    path('users/account.json', views.account, name='users-account'),
    path('health.json', views.health, name='health'),
]
