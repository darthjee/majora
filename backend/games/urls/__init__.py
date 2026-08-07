"""URL patterns for the games app, concatenated from per-resource modules."""

from . import (
    conversations,
    games,
    npcs,
    pcs,
    permissions,
    players,
    system,
    treasures,
    uploads,
)

urlpatterns = (
    games.urlpatterns
    + pcs.urlpatterns
    + npcs.urlpatterns
    + players.urlpatterns
    + conversations.urlpatterns
    + treasures.urlpatterns
    + uploads.urlpatterns
    + system.urlpatterns
    + permissions.urlpatterns
)
