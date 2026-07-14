"""URL patterns for finalizing generic uploads."""

from django.urls import path

from .. import views

urlpatterns = [
    path('uploads/<int:upload_id>.json', views.upload_finalize, name='upload-finalize'),
]
