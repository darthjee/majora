"""PasswordResetToken model for Majora RPG Campaign Management System."""

from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords

from games.settings import Settings


def _default_expires_at():
    """Return the default expiration timestamp for a token created right now."""
    expiration = timedelta(minutes=Settings.password_reset_token_expiration_minutes())
    return timezone.now() + expiration


class PasswordResetToken(models.Model):
    """Model representing a single-use password recovery token for a user."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(default=_default_expires_at)
    invalidated_at = models.DateTimeField(null=True, blank=True)
    history = HistoricalRecords(
        app='versioning', user_db_constraint=False, excluded_fields=['token']
    )

    def is_valid(self):
        """Return True if the token has not been used, not invalidated, and not expired."""
        if self.used_at is not None or self.invalidated_at is not None:
            return False
        return timezone.now() <= self.expires_at

    def consume(self, password):
        """Set the user's new password and mark this token as used."""
        self.user.set_password(password)
        self.user.save()
        self.used_at = timezone.now()
        self.save()

    def __str__(self):
        """Return string representation of the password reset token."""
        return f'PasswordResetToken(user={self.user.username})'
