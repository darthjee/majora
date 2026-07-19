"""BasePhoto abstract model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class BasePhoto(models.Model):
    """Abstract base model for photos shared across characters, games, and items."""

    path = models.CharField(max_length=512, blank=True, default='')
    ready = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False, inherit=True)

    class Meta:
        """Meta options for BasePhoto."""

        abstract = True

    def __str__(self):
        """Return string representation of the photo."""
        return self.path
