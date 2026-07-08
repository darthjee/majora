"""Task model for Majora RPG Campaign Management System."""

from django.db import models


class Task(models.Model):
    """Model representing a DM-private checklist item scoped to a game (and optionally session)."""

    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='tasks')
    session = models.ForeignKey(
        'games.GameSession', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tasks',
    )
    short_description = models.CharField(max_length=200)
    long_description = models.TextField(blank=True, default='')
    completed = models.BooleanField(default=False)

    class Meta:
        """Metadata for the Task model."""

        ordering = ['id']

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this task (delegates to the game's rule)."""
        return self.game.can_be_edited_by(user)

    def __str__(self):
        """Return string representation of the task."""
        return self.short_description
