"""CharacterPhoto model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords

from games.models.character.character import Character


class CharacterPhoto(models.Model):
    """Model representing a photo associated with a character."""

    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='photos')
    path = models.CharField(max_length=512, blank=True, default='')
    ready = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the character photo."""
        return self.path
