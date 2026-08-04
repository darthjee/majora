"""GameDomainGroup model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class GameDomainGroup(models.Model):
    """Model representing a tenant/brand reachable through multiple hostnames."""

    name = models.CharField(max_length=200)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the game domain group."""
        return self.name
