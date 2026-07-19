"""URL configuration for majora_project."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('games.urls')),
    path('', include('accounts.urls')),
]
