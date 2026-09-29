"""GameRecipe model for Majora RPG Campaign Management System."""

from django.core.validators import MinValueValidator
from django.db import models
from simple_history.models import HistoricalRecords


class GameRecipe(models.Model):
    """Model representing a crafting recipe of a game that produces one common item."""

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='recipes',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    hidden = models.BooleanField(default=False)
    game_common_item = models.ForeignKey(
        'games.GameCommonItem', on_delete=models.CASCADE, related_name='recipes',
    )
    yield_quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    crafting_time = models.CharField(max_length=200, blank=True, default='')
    crafting_cost = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    ingredients = models.TextField(blank=True, default='')
    checks = models.TextField(blank=True, default='')
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the GameRecipe model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the game recipe."""
        return self.name
