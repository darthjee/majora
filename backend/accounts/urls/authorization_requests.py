"""URL patterns for authorization-request endpoints."""

from django.urls import path

from accounts import views

urlpatterns = [
    path(
        'users/authorization_requests.json',
        views.create,
        name='users-authorization-requests-create',
    ),
    path(
        'users/authorization_requests/<uuid:uuid>.json',
        views.poll,
        name='users-authorization-requests-poll',
    ),
    path(
        'account/authorization_requests.json',
        views.authorization_requests_list,
        name='account-authorization-requests-list',
    ),
    path(
        'account/authorization_requests/<uuid:uuid>/deny.json',
        views.deny,
        name='account-authorization-requests-deny',
    ),
    path(
        'account/authorization_requests/<uuid:uuid>/authorize.json',
        views.authorize,
        name='account-authorization-requests-authorize',
    ),
]
