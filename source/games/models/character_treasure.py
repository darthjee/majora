"""CharacterTreasure model for Majora RPG Campaign Management System."""

from django.db import models


class CharacterTreasure(models.Model):
    """Model representing a treasure held by a character, with a quantity."""

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_treasures',
    )
    treasure = models.ForeignKey(
        'games.Treasure', on_delete=models.CASCADE, related_name='character_treasures',
    )
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        """Metadata for the CharacterTreasure model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the character treasure."""
        return f'{self.treasure.name} x{self.quantity}'
