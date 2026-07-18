"""CharacterItem model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class CharacterItem(models.Model):
    """Model representing a game item held by a character, with optional overrides.

    `name`/`description`/`photo` are nullable overrides of the linked `GameItem`'s own
    values — a `null` value falls back to the `GameItem`'s value when serialized (see
    `resolve_character_item_field`). `hidden` is a plain field, never inherited from the
    `GameItem`.
    """

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_items',
    )
    game_item = models.ForeignKey(
        'games.GameItem', on_delete=models.CASCADE, related_name='character_items',
    )
    name = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    photo = models.ForeignKey(
        'games.CharacterItemPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the CharacterItem model."""

        ordering = ['id']
        unique_together = [('character', 'game_item')]

    def __str__(self):
        """Return string representation of the character item."""
        return self.name or self.game_item.name
