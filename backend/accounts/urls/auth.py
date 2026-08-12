"""URL patterns for authentication and account-management endpoints."""

from django.urls import path

from accounts import views

urlpatterns = [
    path('users/login.json', views.login, name='users-login'),
    path('users/logout.json', views.logout, name='users-logout'),
    path('users/register.json', views.register, name='users-register'),
    path('users/status.json', views.status, name='users-status'),
    path('staff/test-email.json', views.test_email, name='staff-test-email'),
    path('account/language.json', views.language, name='account-language'),
    path('account/account.json', views.account, name='account-account'),
]
