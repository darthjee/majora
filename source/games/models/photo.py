"""Photo model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.character import Character


class Photo(models.Model):
    """Model representing a photo in a character's gallery."""

    url = models.URLField()
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='photos')

    def __str__(self):
        """Return string representation of the photo."""
        return self.url
