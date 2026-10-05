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
    path(
        'staff/users/<int:user_id>/recovery-tokens/<int:token_id>/force-expire.json',
        views.staff_user_recovery_token_force_expire,
        name='staff-user-recovery-token-force-expire',
    ),
    path(
        'staff/users/<int:user_id>/recovery-tokens/<int:token_id>.json',
        views.staff_user_recovery_token_delete,
        name='staff-user-recovery-token-delete',
    ),
    path('staff/cache.json', views.staff_cache_clear, name='staff-cache-clear'),
    path('staff/cache/summary.json', views.staff_cache_summary, name='staff-cache-summary'),
    path('staff/crawler.json', views.staff_crawler, name='staff-crawler'),
    path('staff/crawler/summary.json', views.staff_crawler_summary, name='staff-crawler-summary'),
    path('staff/photos.json', views.staff_photos_index, name='staff-photos-index'),
    path(
        'staff/photos/<str:photo_type>.json',
        views.staff_photos_list,
        name='staff-photos-list',
    ),
    path(
        'staff/photos/<str:photo_type>/<int:photo_id>/replace.json',
        views.staff_photo_replace,
        name='staff-photo-replace',
    ),
    path(
        'staff/photos/<str:photo_type>/<int:photo_id>/deletable.json',
        views.staff_photo_deletable,
        name='staff-photo-deletable',
    ),
    path(
        'staff/photos/<str:photo_type>/<int:photo_id>.json',
        views.staff_photo_delete,
        name='staff-photo-delete',
    ),
    path(
        'staff/statistics/domains.json',
        views.staff_statistics_domains,
        name='staff-statistics-domains',
    ),
    path(
        'staff/statistics/visits.json',
        views.staff_statistics_visits,
        name='staff-statistics-visits',
    ),
    path(
        'staff/statistics/overview.json',
        views.staff_statistics_overview,
        name='staff-statistics-overview',
    ),
    path(
        'staff/statistics/visitors.json',
        views.staff_statistics_visitors,
        name='staff-statistics-visitors',
    ),
    path(
        'staff/statistics/duration.json',
        views.staff_statistics_duration,
        name='staff-statistics-duration',
    ),
    path(
        'staff/statistics/users.json',
        views.staff_statistics_users,
        name='staff-statistics-users',
    ),
]
