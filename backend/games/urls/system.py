"""URL patterns for system/infra endpoints (readiness, access route config)."""

from django.urls import path

from .. import views

urlpatterns = [
    path('ready.json', views.ready, name='ready'),
    path(
        'access-route-config.json',
        views.access_route_config,
        name='access-route-config',
    ),
]
