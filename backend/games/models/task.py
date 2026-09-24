"""Task model for Majora RPG Campaign Management System."""

from django.db import models


class Task(models.Model):
    """Model representing a DM-private checklist item scoped to a game (and optionally session)."""

    CATEGORY_PRINTING = 'printing'
    CATEGORY_CRAFTING = 'crafting'
    CATEGORY_PAINTING = 'painting'
    CATEGORY_PLANNING = 'planning'
    CATEGORY_WRITING = 'writing'
    CATEGORY_RESEARCH = 'research'
    CATEGORY_SCHEDULING = 'scheduling'
    CATEGORY_BUYING = 'buying'
    CATEGORY_UPDATING = 'updating'
    CATEGORY_OTHER = 'other'

    CATEGORY_CHOICES = [
        (CATEGORY_PRINTING, 'Printing'),
        (CATEGORY_CRAFTING, 'Crafting'),
        (CATEGORY_PAINTING, 'Painting'),
        (CATEGORY_PLANNING, 'Planning'),
        (CATEGORY_WRITING, 'Writing'),
        (CATEGORY_RESEARCH, 'Research'),
        (CATEGORY_SCHEDULING, 'Scheduling'),
        (CATEGORY_BUYING, 'Buying'),
        (CATEGORY_UPDATING, 'Updating'),
        (CATEGORY_OTHER, 'Other'),
    ]

    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='tasks')
    session = models.ForeignKey(
        'games.GameSession', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tasks',
    )
    short_description = models.CharField(max_length=200)
    long_description = models.TextField(blank=True, default='')
    completed = models.BooleanField(default=False)
    category = models.CharField(
        max_length=16, choices=CATEGORY_CHOICES, default=CATEGORY_OTHER,
    )

    class Meta:
        """Metadata for the Task model."""

        ordering = ['id']

    def can_be_edited_by(self, user):
        """Return True if `user` may edit this task (delegates to the game's rule).

        See `can_be_edited_by_roles` for the role-simulated counterpart of this rule.
        """
        return self.game.can_be_edited_by(user)

    def can_be_edited_by_roles(self, is_superuser, is_dm):
        """Return True if a role-simulated caller may edit this task.

        Mirrors `can_be_edited_by`, delegating to the game's own role-simulated rule — a
        task has no independent owner/player concept.
        """
        return self.game.can_be_edited_by_roles(is_superuser, is_dm)

    def __str__(self):
        """Return string representation of the task."""
        return self.short_description
