"""URL patterns for the games app."""

from django.urls import path

from . import views

urlpatterns = [
    path('games.json', views.games_list, name='games-list'),
    path('games/<slug:game_slug>.json', views.game_detail, name='game-detail'),
    path('games/<slug:game_slug>/pcs.json', views.game_pcs, name='game-pcs'),
    path('games/<slug:game_slug>/npcs.json', views.game_npcs, name='game-npcs'),
    path(
        'games/<slug:game_slug>/characters/<int:character_id>.json',
        views.character_detail,
        name='character-detail',
    ),
]
