"""URL patterns for top-level (not game-scoped) treasures."""

from django.urls import path

from .. import views

urlpatterns = [
    path('treasures.json', views.treasures_list, name='treasures-list'),
    path('treasures/<int:treasure_id>.json', views.treasure_detail, name='treasure-detail'),
    path('treasures/<int:treasure_id>/access.json', views.treasure_access, name='treasure-access'),
    path(
        'treasures/<int:treasure_id>/permissions.json',
        views.treasure_permissions,
        name='treasure-permissions',
    ),
    path(
        'treasures/<int:treasure_id>/photo_upload.json',
        views.treasure_photo_upload,
        name='treasure-photo-upload',
    ),
]
