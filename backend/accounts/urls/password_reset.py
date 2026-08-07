"""URL patterns for password-recovery endpoints."""

from django.urls import path

from accounts import views

urlpatterns = [
    path('users/recover.json', views.recover, name='users-recover'),
    path('users/reset-password.json', views.reset_password, name='users-reset-password'),
]
