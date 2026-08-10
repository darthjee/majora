"""URL patterns for the miniatures app, concatenated from per-resource modules."""

from . import sources, stl_models

urlpatterns = sources.urlpatterns + stl_models.urlpatterns
