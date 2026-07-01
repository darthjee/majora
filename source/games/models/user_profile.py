"""UserProfile model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):

    """Model representing a user's account-level preferences."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_language = models.CharField(max_length=10, default='en')

    def __str__(self):
        """Return string representation of the user profile."""
        return f'UserProfile(user={self.user.username})'
