"""Character model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.db import models

from games.models.game import Game
from games.models.player import Player


class Character(models.Model):

    """Model representing a character in a game."""

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
    money = models.PositiveIntegerField(default=0)
    profile_photo = models.ForeignKey(
        'games.CharacterPhoto', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )

    class Meta:
        ordering = ['id']

    @property
    def is_pc(self):
        """Return True if the character is a Player Character (PC)."""
        return not self.npc

    @property
    def editors(self):
        """Return queryset of users with explicit edit rights (player + DMs, no superusers)."""
        from django.db.models import Q

        dm_ids = self.game.game_masters.values_list('user_id', flat=True)
        q = Q(id__in=dm_ids)
        if self.player_id is not None and self.player.user_id is not None:
            q |= Q(id=self.player.user_id)
        return User.objects.filter(q)

    def is_editor(self, user):
        """Return True if `user` has explicit edit rights (player or DM, not superuser)."""
        return self.editors.filter(id=user.id).exists()

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this character (its player, a DM, or a superuser)."""
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.is_editor(user)

    def __str__(self):
        """Return string representation of the character."""
        return self.name
