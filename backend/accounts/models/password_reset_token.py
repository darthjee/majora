"""PasswordResetToken model for Majora RPG Campaign Management System."""

from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from games.settings import Settings


class PasswordResetToken(models.Model):
    """Model representing a single-use password recovery token for a user."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        """Metadata for the PasswordResetToken model."""

        db_table = 'games_passwordresettoken'

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
