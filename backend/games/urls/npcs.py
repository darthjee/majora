"""URL patterns for a game's Non-Player Characters (NPCs)."""

from django.urls import path

from ..views import game
from ..views.game import game_npcs, game_npcs_all, game_npcs_full
from ._character_routes import build_character_urlpatterns

urlpatterns = [
    path('games/<slug:game_slug>/npcs.json', game_npcs, name='game-npcs'),
    path('games/<slug:game_slug>/npcs/all.json', game_npcs_all, name='game-npcs-all'),
    path('games/<slug:game_slug>/npcs/full.json', game_npcs_full, name='game-npcs-full'),
    *build_character_urlpatterns(
        'npc', game, extra_routes=[('/treasures/all.json', 'treasures_all')],
    ),
]
