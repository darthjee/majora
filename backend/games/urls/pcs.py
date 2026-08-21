"""URL patterns for a game's Player Characters (PCs)."""

from django.urls import path

from ..views import game
from ..views.game import game_pcs
from ._character_routes import build_character_urlpatterns

urlpatterns = [
    path('games/<slug:game_slug>/pcs.json', game_pcs, name='game-pcs'),
    *build_character_urlpatterns('pc', game),
]
