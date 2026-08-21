"""URL patterns for system/infra endpoints (readiness, access route config)."""

from django.urls import path

from ..views.access_route_config import access_route_config
from ..views.ready import ready

urlpatterns = [
    path('ready.json', ready, name='ready'),
    path(
        'access-route-config.json',
        access_route_config,
        name='access-route-config',
    ),
]
