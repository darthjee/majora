"""Games app models for Majora RPG Campaign Management System."""

from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from games.settings import Settings


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


class Player(models.Model):
    """Model representing a player participating in games."""

    name = models.CharField(max_length=200)
    games = models.ManyToManyField(Game, blank=True, related_name='players')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='players_accounts',
    )

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
    character_class = models.CharField(max_length=200, blank=True, null=True)
    level = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    npc = models.BooleanField(default=True)

    class Meta:
        ordering = ['id']

    @property
    def is_pc(self):
        """Return True if the character is a Player Character (PC)."""
        return not self.npc

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this character (its player or a superuser)."""
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.player_id is not None and self.player.user_id == user.id

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


class PasswordResetToken(models.Model):
    """Model representing a single-use password recovery token for a user."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        """Return True if the token has not been used and has not expired."""
        if self.used_at is not None:
            return False
        expiration = timedelta(minutes=Settings.password_reset_token_expiration_minutes())
        return timezone.now() <= self.created_at + expiration

    def consume(self, password):
        """Set the user's new password and mark this token as used."""
        self.user.set_password(password)
        self.user.save()
        self.used_at = timezone.now()
        self.save()

    def __str__(self):
        """Return string representation of the password reset token."""
        return f'PasswordResetToken(user={self.user.username})'


class UserProfile(models.Model):
    """Model representing a user's account-level preferences."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_language = models.CharField(max_length=10, default='en')

    def __str__(self):
        """Return string representation of the user profile."""
        return f'UserProfile(user={self.user.username})'
