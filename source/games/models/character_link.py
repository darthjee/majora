"""CharacterLink model for Majora RPG Campaign Management System."""

from django.db import models

from games.models.character import Character


class CharacterLink(models.Model):
    """Model representing an external link related to a character."""

    text = models.CharField(max_length=200)
    url = models.URLField()
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='links')

    def __str__(self):
        """Return string representation of the character link."""
        return self.text
