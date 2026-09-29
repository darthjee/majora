"""CharacterRecipe model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords


class CharacterRecipe(models.Model):
    """Model representing a game recipe known by a character.

    A thin join between a `Character` (PC or NPC) and a `GameRecipe`. All display fields are
    sourced straight from the linked `GameRecipe`. `hidden` is the row's own flag: it is copied
    from `GameRecipe.hidden` on acquire, but here it is a plain field.
    """

    character = models.ForeignKey(
        'games.Character', on_delete=models.CASCADE, related_name='character_recipes',
    )
    game_recipe = models.ForeignKey(
        'games.GameRecipe', on_delete=models.CASCADE, related_name='character_recipes',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the CharacterRecipe model."""

        ordering = ['id']
        unique_together = [('character', 'game_recipe')]

    def __str__(self):
        """Return string representation of the character recipe."""
        return self.game_recipe.name
