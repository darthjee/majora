"""PollOption model for Majora RPG Campaign Management System."""

from django.db import models


class PollOption(models.Model):
    """Model representing a single selectable option belonging to a poll."""

    poll = models.ForeignKey('games.Poll', on_delete=models.CASCADE, related_name='options')
    option = models.CharField(max_length=200)
    selected = models.BooleanField(default=False)

    class Meta:
        """Metadata for the PollOption model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the poll option."""
        return self.option
