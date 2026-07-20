"""URL patterns for games' own actions and sub-resources not yet restructured."""

from django.urls import path

from .. import views

urlpatterns = [
    path('games.json', views.games_list, name='games-list'),
    path('my-games.json', views.my_games_list, name='my-games-list'),
    path('games/<slug:game_slug>.json', views.game_detail, name='game-detail'),
    path('games/<slug:game_slug>/access.json', views.game_access, name='game-access'),
    path(
        'games/<slug:game_slug>/permissions.json',
        views.game_permissions,
        name='game-permissions',
    ),
    path('games/<slug:game_slug>/treasures.json', views.game_treasures, name='game-treasures'),
    path(
        'games/<slug:game_slug>/treasures/all.json',
        views.game_treasures_all,
        name='game-treasures-all',
    ),
    path(
        'games/<slug:game_slug>/treasures/missing.json',
        views.game_treasures_missing,
        name='game-treasures-missing',
    ),
    path(
        'games/<slug:game_slug>/treasures/link.json',
        views.game_treasure_link,
        name='game-treasure-link',
    ),
    path(
        'games/<slug:game_slug>/treasures/<int:treasure_id>.json',
        views.game_treasure_detail,
        name='game-treasure-detail',
    ),
    path('games/<slug:game_slug>/items.json', views.game_items, name='game-items'),
    path(
        'games/<slug:game_slug>/items/all.json',
        views.game_items_all,
        name='game-items-all',
    ),
    path(
        'games/<slug:game_slug>/items/<int:item_id>.json',
        views.game_item_detail,
        name='game-item-detail',
    ),
    path(
        'games/<slug:game_slug>/items/<int:item_id>/all.json',
        views.game_item_detail_all,
        name='game-item-detail-all',
    ),
    path(
        'games/<slug:game_slug>/items/<int:item_id>/photo_upload.json',
        views.game_item_photo_upload,
        name='game-item-photo-upload',
    ),
    path('games/<slug:game_slug>/photos.json', views.game_photos, name='game-photos'),
    path(
        'games/<slug:game_slug>/sessions.json',
        views.game_sessions_create,
        name='game-sessions-list',
    ),
    path(
        'games/<slug:game_slug>/sessions/past.json',
        views.game_sessions_past,
        name='game-sessions-past',
    ),
    path(
        'games/<slug:game_slug>/sessions/future.json',
        views.game_sessions_future,
        name='game-sessions-future',
    ),
    path(
        'games/<slug:game_slug>/sessions/unscheduled.json',
        views.game_sessions_unscheduled,
        name='game-sessions-unscheduled',
    ),
    path(
        'games/<slug:game_slug>/sessions/<int:session_id>.json',
        views.game_session_detail,
        name='game-session-detail',
    ),
    path(
        'games/<slug:game_slug>/sessions/<int:session_id>/messages.json',
        views.session_messages_list,
        name='session-messages-list',
    ),
    path(
        'games/<slug:game_slug>/sessions/<int:session_id>/poll.json',
        views.session_poll_create,
        name='game-session-poll-create',
    ),
    path('games/<slug:game_slug>/tasks.json', views.game_tasks_list, name='game-tasks-list'),
    path(
        'games/<slug:game_slug>/tasks/<int:task_id>.json',
        views.game_task_detail,
        name='game-task-detail',
    ),
    path('games/<slug:game_slug>/polls.json', views.game_polls_list, name='game-polls-list'),
    path(
        'games/<slug:game_slug>/polls/<int:poll_id>.json',
        views.game_poll_detail,
        name='game-poll-detail',
    ),
    path(
        'games/<slug:game_slug>/polls/<int:poll_id>/votes.json',
        views.game_poll_votes,
        name='game-poll-votes',
    ),
    path(
        'games/<slug:game_slug>/polls/<int:poll_id>/close.json',
        views.game_poll_close,
        name='game-poll-close',
    ),
    path(
        'games/<slug:game_slug>/photo_upload.json',
        views.photo_upload,
        name='game-photo-upload',
    ),
]
