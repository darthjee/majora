"""URL patterns for authentication and account-management endpoints."""

from django.urls import path

from .. import views

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
]
