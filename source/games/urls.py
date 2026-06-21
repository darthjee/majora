"""URL patterns for the games app."""

from django.urls import path

from . import views

urlpatterns = [
    path('games.json', views.games_list, name='games-list'),
    path('games/<slug:game_slug>.json', views.game_detail, name='game-detail'),
    path('games/<slug:game_slug>/pcs.json', views.game_pcs, name='game-pcs'),
    path('games/<slug:game_slug>/npcs.json', views.game_npcs, name='game-npcs'),
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
    path('users/login.json', views.login, name='users-login'),
    path('users/logout.json', views.logout, name='users-logout'),
    path('users/register.json', views.register, name='users-register'),
    path('users/status.json', views.status, name='users-status'),
    path('users/test-email.json', views.test_email, name='users-test-email'),
    path('users/recover.json', views.recover, name='users-recover'),
    path('users/reset-password.json', views.reset_password, name='users-reset-password'),
]
