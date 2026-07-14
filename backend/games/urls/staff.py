"""URL patterns for staff-only user-management endpoints."""

from django.urls import path

from .. import views

urlpatterns = [
    path('staff/users.json', views.staff_users_list, name='staff-users-list'),
    path('staff/users/<int:user_id>.json', views.staff_user_detail, name='staff-user-detail'),
    path(
        'staff/users/<int:user_id>/recovery-link.json',
        views.staff_user_recovery_link,
        name='staff-user-recovery-link',
    ),
]
