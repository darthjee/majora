"""Message model for Majora RPG Campaign Management System."""

from django.db import models

from conversations.models.conversation import Conversation


class Message(models.Model):
    """Model representing a single message posted to a conversation."""

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages',
    )
    player = models.ForeignKey(
        'games.Player', on_delete=models.CASCADE, related_name='sent_messages',
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for the Message model."""

        ordering = ['-id']

    def __str__(self):
        """Return string representation of the message."""
        return f'Message(conversation={self.conversation_id}, player={self.player_id})'
