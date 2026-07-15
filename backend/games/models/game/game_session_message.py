"""GameSessionMessage model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models


class GameSessionMessage(models.Model):
    """Model representing a single chat message posted to a game session."""

    session = models.ForeignKey(
        'games.GameSession', on_delete=models.CASCADE, related_name='messages',
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_messages')
    player = models.ForeignKey(
        'games.Player', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='session_messages',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for the GameSessionMessage model."""

        ordering = ['-id']

    def __str__(self):
        """Return string representation of the session message."""
        return f'GameSessionMessage(session={self.session_id}, user={self.user.username})'
