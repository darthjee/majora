"""URL patterns for the games app, concatenated from per-resource modules."""

from . import auth, games, npcs, pcs, staff, system, treasures, uploads

urlpatterns = (
    games.urlpatterns
    + pcs.urlpatterns
    + npcs.urlpatterns
    + treasures.urlpatterns
    + uploads.urlpatterns
    + staff.urlpatterns
    + auth.urlpatterns
    + system.urlpatterns
)
