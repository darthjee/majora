"""MessageVisualisation model for Majora RPG Campaign Management System."""

from django.db import models

from conversations.models.message import Message


class MessageVisualisation(models.Model):
    """Model representing a player's visualisation state for a message."""

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='visualisations')
    player = models.ForeignKey(
        'games.Player', on_delete=models.CASCADE, related_name='message_visualisations',
    )
    not_seen = models.BooleanField(default=False)

    class Meta:
        """Metadata for the MessageVisualisation model."""

        unique_together = [('message', 'player')]

    def __str__(self):
        """Return string representation of the message visualisation."""
        return f'MessageVisualisation(message={self.message_id}, player={self.player_id})'
