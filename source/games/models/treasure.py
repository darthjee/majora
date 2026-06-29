"""Treasure model for Majora RPG Campaign Management System."""

from django.db import models


class Treasure(models.Model):
    """Model representing a treasure item in an RPG campaign."""

    name = models.CharField(max_length=200)
    value = models.IntegerField()

    class Meta:
        ordering = ['id']

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this treasure (superuser only)."""
        return bool(user and user.is_authenticated and user.is_superuser)

    def __str__(self):
        """Return string representation of the treasure."""
        return self.name
