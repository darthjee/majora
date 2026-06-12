"""Games app models for Majora RPG Campaign Management System."""

from django.db import models
from django.utils.text import slugify


class Game(models.Model):
    """Model representing an RPG game/campaign."""

    name = models.CharField(max_length=200)
    game_slug = models.SlugField(unique=True, max_length=200)
    photo = models.URLField(null=True, blank=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        """Save the game, generating game_slug from name if not set."""
        if not self.game_slug:
            self.game_slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        """Return string representation of the game."""
        return self.name


class Player(models.Model):
    """Model representing a player participating in games."""

    name = models.CharField(max_length=200)
    games = models.ManyToManyField(Game, blank=True, related_name='players')

    class Meta:
        ordering = ['name']

    def __str__(self):
        """Return string representation of the player."""
        return self.name


class Character(models.Model):
    """Model representing a character in a game."""

    name = models.CharField(max_length=200)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='characters')
    player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='characters',
    )
    avatar_url = models.URLField(null=True, blank=True)
    character_class = models.CharField(max_length=200, blank=True)
    level = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']

    @property
    def is_pc(self):
        """Return True if the character is a Player Character (PC)."""
        return self.player is not None

    def __str__(self):
        """Return string representation of the character."""
        return self.name


class Photo(models.Model):
    """Model representing a photo in a character's gallery."""

    url = models.URLField()
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='photos')

    def __str__(self):
        """Return string representation of the photo."""
        return self.url


class Link(models.Model):
    """Model representing an external link related to a game."""

    text = models.CharField(max_length=200)
    url = models.URLField()
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='links')

    def __str__(self):
        """Return string representation of the link."""
        return self.text
