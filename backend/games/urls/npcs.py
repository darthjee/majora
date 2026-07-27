"""URL patterns for a game's Non-Player Characters (NPCs)."""

from django.urls import path

from .. import views
from ._character_routes import build_character_urlpatterns

urlpatterns = [
    path('games/<slug:game_slug>/npcs.json', views.game_npcs, name='game-npcs'),
    path('games/<slug:game_slug>/npcs/all.json', views.game_npcs_all, name='game-npcs-all'),
    path('games/<slug:game_slug>/npcs/full.json', views.game_npcs_full, name='game-npcs-full'),
    *build_character_urlpatterns(
        'npc', views, extra_routes=[('/treasures/all.json', 'treasures_all')],
    ),
]
