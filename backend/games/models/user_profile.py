"""UserProfile model for Majora RPG Campaign Management System."""

import hashlib

from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    """Model representing a user's account-level preferences."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_language = models.CharField(max_length=10, default='en')
    email_hash = models.CharField(max_length=64, null=True, blank=True)

    def save(self, *args, **kwargs):
        """Save the profile, recomputing email_hash from the linked user's email."""
        self.email_hash = self._compute_email_hash()
        super().save(*args, **kwargs)

    def _compute_email_hash(self):
        """Return the SHA-256 hex digest of the trimmed, lowercased user email."""
        email = (self.user.email or '').strip().lower()
        if not email:
            return None
        return hashlib.sha256(email.encode()).hexdigest()

    def __str__(self):
        """Return string representation of the user profile."""
        return f'UserProfile(user={self.user.username})'
