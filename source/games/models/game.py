"""Game model for Majora RPG Campaign Management System."""

from django.db import models
from django.utils.text import slugify


class Game(models.Model):
    """Model representing an RPG game/campaign."""

    name = models.CharField(max_length=200)
    game_slug = models.SlugField(unique=True, max_length=200)
    photo = models.URLField(null=True, blank=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        """Save the game, generating game_slug from name if not set."""
        if not self.game_slug:
            self.game_slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        """Return string representation of the game."""
        return self.name
