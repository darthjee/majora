"""URL patterns for a game's conversations."""

from django.urls import path

from ..views.game import game_conversations

urlpatterns = [
    path(
        'games/<slug:game_slug>/conversations.json',
        game_conversations,
        name='game-conversations',
    ),
]
