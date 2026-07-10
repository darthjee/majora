"""CharacterLink model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords

from games.models.character import Character


class CharacterLink(models.Model):
    """Model representing an external link related to a character."""

    LINK_TYPE_LOOTSTUDIO = 'lootstudio'

    LINK_TYPE_CHOICES = [
        (LINK_TYPE_LOOTSTUDIO, 'LootStudio'),
    ]

    text = models.CharField(max_length=200)
    url = models.URLField()
    link_type = models.CharField(
        max_length=32, choices=LINK_TYPE_CHOICES, blank=True, default=''
    )
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='links')
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the character link."""
        return self.text
