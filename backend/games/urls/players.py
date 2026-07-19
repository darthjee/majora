"""URL patterns for a game's players."""

from django.urls import path

from .. import views

urlpatterns = [
    path('games/<slug:game_slug>/players.json', views.game_players, name='game-players'),
    path(
        'games/<slug:game_slug>/players/<int:player_id>.json',
        views.game_player_detail,
        name='game-player-detail',
    ),
]
