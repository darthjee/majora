"""GameCommonItem model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class GameCommonItem(models.Model):
    """Model representing a priced catalog entry (potion, drug, ammunition, etc) of a game."""

    CATEGORY_POTION = 'potion'
    CATEGORY_DRUG = 'drug'
    CATEGORY_CONSUMABLE = 'consumable'
    CATEGORY_AMMUNITION = 'ammunition'
    CATEGORY_POISON = 'poison'
    CATEGORY_GEAR = 'gear'
    CATEGORY_OTHER = 'other'

    CATEGORY_CHOICES = [
        (CATEGORY_POTION, 'Potion'),
        (CATEGORY_DRUG, 'Drug'),
        (CATEGORY_CONSUMABLE, 'Consumable'),
        (CATEGORY_AMMUNITION, 'Ammunition'),
        (CATEGORY_POISON, 'Poison'),
        (CATEGORY_GEAR, 'Gear'),
        (CATEGORY_OTHER, 'Other'),
    ]

    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, related_name='common_items',
    )
    name = models.CharField(max_length=200)
    price = models.IntegerField()
    description = models.TextField(blank=True, default='')
    photo = models.ForeignKey(
        'games.GameCommonItemPhoto', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )
    hidden = models.BooleanField(default=False)
    category = models.CharField(
        max_length=16, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER,
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the GameCommonItem model."""

        ordering = ['id']

    def __str__(self):
        """Return string representation of the game common item."""
        return self.name
