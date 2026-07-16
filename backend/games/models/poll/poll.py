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

    OPTION_TYPE_TEXT = 'text'
    OPTION_TYPE_DATE = 'date'

    OPTION_TYPE_CHOICES = [
        (OPTION_TYPE_TEXT, 'Text'),
        (OPTION_TYPE_DATE, 'Date'),
    ]

    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='polls')
    title = models.CharField(max_length=200, blank=True, default='')
    description = models.TextField(blank=True, default='', max_length=5000)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES, default=TYPE_SINGLE)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_INACTIVE)
    option_type = models.CharField(
        max_length=16, choices=OPTION_TYPE_CHOICES, default=OPTION_TYPE_TEXT,
    )

    class Meta:
        """Metadata for the Poll model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the poll."""
        return f'Poll(game={self.game.name}, type={self.type})'
