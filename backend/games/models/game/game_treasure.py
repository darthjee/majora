"""GameTreasure through model for Majora RPG Campaign Management System."""

from django.db import models


class GameTreasure(models.Model):
    """Model representing the link between a Game and a shared Treasure, with a stock cap."""

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='game_treasures',
    )
    treasure = models.ForeignKey(
        'games.Treasure', on_delete=models.CASCADE, related_name='game_treasures',
    )
    max_units = models.PositiveIntegerField(null=True, blank=True)
    acquired_units = models.PositiveIntegerField(default=0)

    class Meta:
        """Metadata for the GameTreasure model."""

        ordering = ['id']
        unique_together = [('game', 'treasure')]

    @property
    def available_units(self):
        """Return the remaining acquirable units, or None when max_units is unlimited."""
        if self.max_units is None:
            return None
        return max(self.max_units - self.acquired_units, 0)

    def __str__(self):
        """Return string representation of the game treasure link."""
        return f'GameTreasure(game={self.game.name}, treasure={self.treasure.name})'
