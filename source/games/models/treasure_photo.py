"""TreasurePhoto model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.treasure import Treasure


class TreasurePhoto(models.Model):
    """Model representing a photo associated with a treasure."""

    treasure = models.ForeignKey(Treasure, on_delete=models.CASCADE, related_name='photos')
    path = models.CharField(max_length=512, blank=True, default='')
    ready = models.BooleanField(default=False)

    def __str__(self):
        """Return string representation of the treasure photo."""
        return self.path
