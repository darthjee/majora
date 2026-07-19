"""URL patterns for a game's conversations."""

from django.urls import path

from .. import views

urlpatterns = [
    path(
        'games/<slug:game_slug>/conversations.json',
        views.game_conversations,
        name='game-conversations',
    ),
]
