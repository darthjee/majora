"""Treasure model for Majora RPG Campaign Management System."""

from django.db import models
from simple_history.models import HistoricalRecords

from games.models.game.game import Game


class Treasure(models.Model):
    """Model representing a treasure item in an RPG campaign."""

    name = models.CharField(max_length=200)
    value = models.IntegerField()
    game_type = models.CharField(
        max_length=16, choices=Game.GAME_TYPE_CHOICES, default=Game.GAME_TYPE_DND
    )
    photo = models.ForeignKey(
        'games.TreasurePhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    game = models.ForeignKey(
        'games.Game', on_delete=models.CASCADE, null=True, blank=True,
        related_name='exclusive_treasures',
    )
    hidden = models.BooleanField(default=False)
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the Treasure model."""

        ordering = ['id']

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this treasure (superuser only).

        See `can_be_edited_by_roles` for the role-simulated counterpart of this rule. Note
        this method alone does not capture the full `can_edit` picture for a game-exclusive
        treasure — see `TreasureAccessSerializer`/`TreasurePermissionsSerializer`, which also
        consult the owning game's own edit rule.
        """
        return bool(user and user.is_authenticated and user.is_superuser)

    def can_be_edited_by_roles(self, is_superuser, is_dm):
        """Return True if a role-simulated caller may edit this treasure.

        Preserves the dual-path logic from `TreasureAccessSerializer._get_can_edit` (issue
        #296): a global treasure (no owning game) is superuser-only even under simulation;
        only a game-exclusive treasure's `dm` role matters in addition.
        """
        return is_superuser or (self.game_id is not None and is_dm)

    def __str__(self):
        """Return string representation of the treasure."""
        return self.name
