"""Game model for Majora RPG Campaign Management System."""

from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils.text import slugify
from simple_history.models import HistoricalRecords


class Game(models.Model):
    """Model representing an RPG game/campaign."""

    GAME_TYPE_DND = 'dnd'
    GAME_TYPE_DEADLANDS = 'deadlands'

    GAME_TYPE_CHOICES = [
        (GAME_TYPE_DND, 'D&D'),
        (GAME_TYPE_DEADLANDS, 'Deadlands'),
    ]

    name = models.CharField(max_length=200)
    game_slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField(blank=True, default='')
    game_type = models.CharField(
        max_length=16, choices=GAME_TYPE_CHOICES, default=GAME_TYPE_DND
    )
    links = GenericRelation('games.Link')
    treasures = models.ManyToManyField(
        'Treasure', through='GameTreasure', blank=True,
        related_name='linked_games', related_query_name='linked_game',
    )
    cover_photo = models.ForeignKey(
        'games.GamePhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the Game model."""

        ordering = ['id']

    def save(self, *args, **kwargs):
        """Save the game, generating game_slug from name if not set."""
        if not self.game_slug:
            self.game_slug = slugify(self.name)
        super().save(*args, **kwargs)

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this game (a DM or superuser).

        See `can_be_edited_by_roles` for the role-simulated counterpart of this rule.
        """
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.has_player(user, is_dm=True)

    def has_player(self, user, is_dm=None):
        """Return whether `user` is a player of this game, optionally filtered by `is_dm`."""
        filters = {'user': user}
        if is_dm is not None:
            filters['is_dm'] = is_dm
        return self.players.filter(**filters).exists()

    def can_be_edited_by_roles(self, is_superuser, is_dm):
        """Return True if a role-simulated caller may edit this game.

        Mirrors `can_be_edited_by`, computed over simulated-identity booleans instead of a
        live `user`, for the `role`-simulated path of `permissions.json`.
        """
        return is_superuser or is_dm

    def __str__(self):
        """Return string representation of the game."""
        return self.name
