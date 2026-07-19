"""Character model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models
from simple_history.models import HistoricalRecords

from games.caches import CharacterEditorCache
from games.models.game.game import Game
from games.models.game.player import Player


class Character(models.Model):
    """Model representing a character in a game."""

    ALLEGIANCE_ALLY = 'ally'
    ALLEGIANCE_ENEMY = 'enemy'
    ALLEGIANCE_NEUTRAL = 'neutral'

    ALLEGIANCE_CHOICES = [
        (ALLEGIANCE_ALLY, 'Ally'),
        (ALLEGIANCE_ENEMY, 'Enemy'),
        (ALLEGIANCE_NEUTRAL, 'Neutral'),
    ]

    name = models.CharField(max_length=200)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='characters')
    player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='characters',
    )
    role = models.CharField(max_length=200, null=True, blank=True)
    public_description = models.TextField(blank=True)
    private_description = models.TextField(blank=True)
    npc = models.BooleanField(default=True)
    hidden = models.BooleanField(default=False)
    slain = models.BooleanField(default=False)
    public_slain = models.BooleanField(default=False)
    allegiance = models.CharField(
        max_length=16, choices=ALLEGIANCE_CHOICES, default=ALLEGIANCE_NEUTRAL
    )
    public_allegiance = models.CharField(
        max_length=16, choices=ALLEGIANCE_CHOICES, default=ALLEGIANCE_NEUTRAL
    )
    money = models.PositiveIntegerField(default=0)
    profile_photo = models.ForeignKey(
        'games.CharacterPhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    history = HistoricalRecords(app='versioning', user_db_constraint=False)

    class Meta:
        """Metadata for the Character model."""

        ordering = ['id']
        constraints = [
            # No `condition=` here: MySQL doesn't support Django's partial/conditional
            # unique constraints (`connection.features.supports_partial_indexes` is False),
            # so it would silently no-op. A plain UniqueConstraint already achieves the
            # intended "at most one PC per Player" rule on MySQL without one, since MySQL's
            # standard NULL semantics treat every NULL as distinct in a unique index —
            # any number of NPCs/unowned PCs with `player=None` remain unaffected, only
            # non-null `player` values are constrained to be unique.
            models.UniqueConstraint(
                fields=['player'],
                name='unique_player_character',
            ),
        ]

    @property
    def is_pc(self):
        """Return True if the character is a Player Character (PC)."""
        return not self.npc

    @property
    def editors(self):
        """Return queryset of users with explicit edit rights (player + DMs, no superusers)."""
        from django.db.models import Q

        dm_ids = self.game.players.filter(is_dm=True).values_list('user_id', flat=True)
        q = Q(id__in=dm_ids)
        if self.player_id is not None and self.player.user_id is not None:
            q |= Q(id=self.player.user_id)
        return User.objects.filter(q)

    def is_editor(self, user):
        """Return True if `user` has explicit edit rights (player or DM, not superuser)."""
        return CharacterEditorCache.is_editor(self, user)

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this character (its player, a DM, or a superuser).

        See `can_be_edited_by_roles` for the role-simulated counterpart of this rule.
        """
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.is_editor(user)

    def can_be_edited_by_roles(self, is_superuser, is_dm, is_owner):
        """Return True if a role-simulated caller may edit this character.

        Mirrors `can_be_edited_by`, computed over simulated-identity booleans instead of a
        live `user`. `is_owner` is only ever consulted for a PC (`self.is_pc`) — NPCs have no
        ownership concept, matching `PcAccessSerializer`/base `_get_is_owner`'s convention.
        """
        if is_superuser or is_dm:
            return True
        return is_owner if self.is_pc else False

    def __str__(self):
        """Return string representation of the character."""
        return self.name
