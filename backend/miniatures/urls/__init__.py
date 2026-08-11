"""URL patterns for the miniatures app, concatenated from per-resource modules."""

from . import collections, sources, stl_models

urlpatterns = collections.urlpatterns + sources.urlpatterns + stl_models.urlpatterns
