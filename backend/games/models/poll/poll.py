"""Poll model for Majora RPG Campaign Management System."""

from django.db import models


class Poll(models.Model):
    """Model representing a poll players can vote on within a game."""

    TYPE_SINGLE = 'single'
    TYPE_MULTIPLE = 'multiple'

    TYPE_CHOICES = [
        (TYPE_SINGLE, 'Single'),
        (TYPE_MULTIPLE, 'Multiple'),
    ]

    STATUS_OPEN = 'open'
    STATUS_INACTIVE = 'inactive'
    STATUS_CLOSED = 'closed'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_CLOSED, 'Closed'),
    ]

    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='polls')
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=TYPE_SINGLE)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_INACTIVE)

    class Meta:
        """Metadata for the Poll model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the poll."""
        return f'Poll(game={self.game.name}, type={self.type})'
