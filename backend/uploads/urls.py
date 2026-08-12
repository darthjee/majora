"""URL patterns for finalizing generic uploads."""

from django.urls import re_path

from . import views

urlpatterns = [
    re_path(
        r'^uploads/(?P<upload_type>image|file)/(?P<upload_id>[0-9]+)\.json$',
        views.upload_finalize,
        name='upload-finalize',
    ),
]
