"""Game model for Majora RPG Campaign Management System."""

from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils.text import slugify


class Game(models.Model):

    """Model representing an RPG game/campaign."""

    name = models.CharField(max_length=200)
    game_slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField(blank=True, default='')
    links = GenericRelation('games.Link')
    treasures = models.ManyToManyField('Treasure', blank=True)
    cover_photo = models.ForeignKey(
        'games.GamePhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        """Save the game, generating game_slug from name if not set."""
        if not self.game_slug:
            self.game_slug = slugify(self.name)
        super().save(*args, **kwargs)

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this game (a DM or superuser)."""
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.game_masters.filter(user=user).exists()

    def __str__(self):
        """Return string representation of the game."""
        return self.name
