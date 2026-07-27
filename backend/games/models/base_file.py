"""BaseFile abstract model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class BaseFile(models.Model):
    """Abstract base model for non-photo files shared across game entities."""

    path = models.CharField(max_length=512, blank=True, default='')
    ready = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False, inherit=True)

    class Meta:
        """Meta options for BaseFile."""

        abstract = True

    def __str__(self):
        """Return string representation of the file."""
        return self.path
