"""URL patterns for staff-only user-management endpoints."""

from django.urls import path

from . import views

urlpatterns = [
    path('staff/users.json', views.staff_users_list, name='staff-users-list'),
    path('staff/users/approve.json', views.staff_user_approve, name='staff-user-approve'),
    path('staff/users/deny.json', views.staff_user_deny, name='staff-user-deny'),
    path('staff/users/<int:user_id>.json', views.staff_user_detail, name='staff-user-detail'),
    path(
        'staff/users/<int:user_id>/recovery-link.json',
        views.staff_user_recovery_link,
        name='staff-user-recovery-link',
    ),
    path(
        'staff/users/<int:user_id>/recovery-tokens.json',
        views.staff_user_recovery_tokens,
        name='staff-user-recovery-tokens',
    ),
    path(
        'staff/users/<int:user_id>/recovery-tokens/<int:token_id>/unexpire.json',
        views.staff_user_recovery_token_unexpire,
        name='staff-user-recovery-token-unexpire',
    ),
    path('staff/cache.json', views.staff_cache_clear, name='staff-cache-clear'),
    path('staff/cache/summary.json', views.staff_cache_summary, name='staff-cache-summary'),
]
