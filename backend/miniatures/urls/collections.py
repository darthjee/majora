"""URL patterns for the Collection resource."""

from django.urls import path

from .. import views

urlpatterns = [
    path(
        'miniatures/collections.json',
        views.collections_list,
        name='miniatures-collections-list',
    ),
    path(
        'miniatures/collections/<int:collection_id>.json',
        views.collection_detail,
        name='miniatures-collections-detail',
    ),
    path(
        'miniatures/collections/<int:collection_id>/photo_upload.json',
        views.collection_photo_upload,
        name='miniatures-collections-photo-upload',
    ),
]
