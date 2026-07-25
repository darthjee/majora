"""URL patterns for authentication and account-management endpoints."""

from django.urls import path

from accounts import views

urlpatterns = [
    path('users/login.json', views.login, name='users-login'),
    path('users/logout.json', views.logout, name='users-logout'),
    path('users/register.json', views.register, name='users-register'),
    path('users/status.json', views.status, name='users-status'),
    path('users/test-email.json', views.test_email, name='users-test-email'),
    path('users/recover.json', views.recover, name='users-recover'),
    path('users/reset-password.json', views.reset_password, name='users-reset-password'),
    path('users/language.json', views.language, name='users-language'),
    path('users/account.json', views.account, name='users-account'),
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
