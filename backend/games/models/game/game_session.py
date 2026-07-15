"""GameSession model for Majora RPG Campaign Management System."""

from django.db import models


class GameSession(models.Model):
    """Model representing a recorded session of an RPG campaign."""

    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=200)
    date = models.DateField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        """Metadata for the GameSession model."""

        ordering = ['id']

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this session (delegates to the game's rule).

        See `can_be_edited_by_roles` for the role-simulated counterpart of this rule.
        """
        return self.game.can_be_edited_by(user)

    def can_be_edited_by_roles(self, is_superuser, is_dm):
        """Return True if a role-simulated caller may edit this session.

        Mirrors `can_be_edited_by`, delegating to the game's own role-simulated rule — a
        session has no independent owner/player concept.
        """
        return self.game.can_be_edited_by_roles(is_superuser, is_dm)

    def __str__(self):
        """Return string representation of the session."""
        return self.title
