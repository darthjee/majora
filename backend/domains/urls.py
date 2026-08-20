"""URL patterns for the domains app."""

from django.urls import path

from domains import views

urlpatterns = [
    path('domain/config.json', views.config, name='domain-config'),
]
