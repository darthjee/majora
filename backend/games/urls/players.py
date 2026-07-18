"""URL patterns for a game's players."""

from django.urls import path

from .. import views

urlpatterns = [
    path('games/<slug:game_slug>/players.json', views.game_players, name='game-players'),
]
