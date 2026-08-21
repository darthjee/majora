"""URL patterns for top-level (not game-scoped) treasures."""

from django.urls import path

from ..views.treasures import (
    treasure_access,
    treasure_detail,
    treasure_photo_upload,
    treasures_list,
)

urlpatterns = [
    path('treasures.json', treasures_list, name='treasures-list'),
    path('treasures/<int:treasure_id>.json', treasure_detail, name='treasure-detail'),
    path('treasures/<int:treasure_id>/access.json', treasure_access, name='treasure-access'),
    path(
        'treasures/<int:treasure_id>/photo_upload.json',
        treasure_photo_upload,
        name='treasure-photo-upload',
    ),
]
