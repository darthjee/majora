"""URL patterns for the Source resource."""

from django.urls import path

from .. import views

urlpatterns = [
    path('miniatures/sources.json', views.sources_list, name='miniatures-sources-list'),
    path(
        'miniatures/sources/<int:source_id>.json',
        views.source_detail,
        name='miniatures-sources-detail',
    ),
    path(
        'miniatures/sources/<int:source_id>/photo_upload.json',
        views.source_photo_upload,
        name='miniatures-sources-photo-upload',
    ),
]
