"""ConversationParticipant model for Majora RPG Campaign Management System."""

from django.db import models

from conversations.models.conversation import Conversation


class ConversationParticipant(models.Model):
    """Model representing a player's participation in a conversation."""

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='participants',
    )
    player = models.ForeignKey(
        'games.Player', on_delete=models.CASCADE, related_name='conversation_participations',
    )

    class Meta:
        """Metadata for the ConversationParticipant model."""

        unique_together = [('conversation', 'player')]

    def __str__(self):
        """Return string representation of the conversation participant."""
        return f'ConversationParticipant(conversation={self.conversation_id}, ' \
            f'player={self.player_id})'
