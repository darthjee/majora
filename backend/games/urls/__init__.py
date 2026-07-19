"""URL patterns for the games app, concatenated from per-resource modules."""

from . import auth, conversations, games, npcs, pcs, players, staff, system, treasures, uploads

urlpatterns = (
    games.urlpatterns
    + pcs.urlpatterns
    + npcs.urlpatterns
    + players.urlpatterns
    + conversations.urlpatterns
    + treasures.urlpatterns
    + uploads.urlpatterns
    + staff.urlpatterns
    + auth.urlpatterns
    + system.urlpatterns
)
