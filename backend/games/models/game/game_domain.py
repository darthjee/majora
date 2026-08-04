"""GameDomain model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords

from games.models.game.game_domain_group import GameDomainGroup


class GameDomain(models.Model):
    """Model representing a hostname that resolves to a GameDomainGroup."""

    domain = models.CharField(max_length=200, unique=True)
    game_domain_group = models.ForeignKey(
        GameDomainGroup, on_delete=models.CASCADE, related_name='domains'
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    def __str__(self):
        """Return string representation of the game domain."""
        return self.domain
