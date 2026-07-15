"""PollVote model for Majora RPG Campaign Management System."""

from django.core.exceptions import ValidationError
from django.db import models

from games.models.poll.poll import Poll


class PollVote(models.Model):
    """Model linking a player to the poll option they voted for."""

    player = models.ForeignKey(
        'games.Player', on_delete=models.CASCADE, related_name='poll_votes',
    )
    option = models.ForeignKey(
        'games.PollOption', on_delete=models.CASCADE, related_name='votes',
    )

    class Meta:
        """Metadata for the PollVote model."""

        unique_together = [('player', 'option')]
        ordering = ['id']

    def clean(self):
        """Validate that the vote respects the poll's game membership and type rules."""
        self._validate_player_belongs_to_game()
        self._validate_single_type_vote()

    def _validate_player_belongs_to_game(self):
        """Raise ValidationError if the player does not belong to the poll's game."""
        if not self.option.poll.game.players.filter(pk=self.player.pk).exists():
            raise ValidationError('Player must belong to the poll game to vote.')

    def _validate_single_type_vote(self):
        """Raise ValidationError on a second option vote for a single-type poll."""
        if self.option.poll.type != Poll.TYPE_SINGLE:
            return
        other_votes_exist = PollVote.objects.filter(
            player=self.player, option__poll=self.option.poll,
        ).exclude(option=self.option).exists()
        if other_votes_exist:
            raise ValidationError('Player may only vote for one option on a single-type poll.')

    def save(self, *args, **kwargs):
        """Persist the vote, enforcing validation rules beforehand."""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        """Return string representation of the poll vote."""
        return f'PollVote(player={self.player.name}, option={self.option.option})'
