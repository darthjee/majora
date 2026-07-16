"""PollVote model for Majora RPG Campaign Management System."""

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models

from games.models.poll.poll import Poll


class PollVote(models.Model):
    """Model linking a user to the poll option they voted for."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_votes')
    option = models.ForeignKey(
        'games.PollOption', on_delete=models.CASCADE, related_name='votes',
    )

    class Meta:
        """Metadata for the PollVote model."""

        unique_together = [('user', 'option')]
        ordering = ['id']

    def clean(self):
        """Validate that the vote respects the poll's game membership and type rules."""
        self._validate_user_belongs_to_game()
        self._validate_single_type_vote()

    def _validate_user_belongs_to_game(self):
        """Raise ValidationError if the user is not a player or DM of the poll's game."""
        game = self.option.poll.game
        is_member = (
            game.players.filter(user=self.user).exists()
            or game.game_masters.filter(user=self.user).exists()
        )
        if not is_member:
            raise ValidationError(
                'User must be a player or game master of the poll game to vote.'
            )

    def _validate_single_type_vote(self):
        """Raise ValidationError on a second option vote for a single-type poll.

        Excludes both this row's own pk (so updating an existing single-type vote's
        `option` in place doesn't flag itself as an "other" vote) and its current
        `option` (so a duplicate create attempt for the same option surfaces as the
        DB's own IntegrityError instead of this validation error).
        """
        if self.option.poll.type != Poll.TYPE_SINGLE:
            return
        other_votes_exist = PollVote.objects.filter(
            user=self.user, option__poll=self.option.poll,
        ).exclude(models.Q(pk=self.pk) | models.Q(option=self.option)).exists()
        if other_votes_exist:
            raise ValidationError('User may only vote for one option on a single-type poll.')

    def save(self, *args, **kwargs):
        """Persist the vote, enforcing validation rules beforehand."""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        """Return string representation of the poll vote."""
        return f'PollVote(user={self.user.username}, option={self.option.option})'
