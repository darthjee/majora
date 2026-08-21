"""URL patterns for a game's players."""

from django.urls import path

from ..views.game import game_player_detail, game_players

urlpatterns = [
    path('games/<slug:game_slug>/players.json', game_players, name='game-players'),
    path(
        'games/<slug:game_slug>/players/<int:player_id>.json',
        game_player_detail,
        name='game-player-detail',
    ),
]
