"""Conversation model for Majora RPG Campaign Management System."""

from django.db import models


class Conversation(models.Model):
    """Model representing a private/group conversation between players."""

    title = models.CharField(max_length=200)
    owner = models.ForeignKey(
        'games.Player', on_delete=models.CASCADE, related_name='owned_conversations',
    )

    def __str__(self):
        """Return string representation of the conversation."""
        return self.title
