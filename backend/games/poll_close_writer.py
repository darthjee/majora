"""Resolve and persist the winning option when a DM/admin closes a poll."""

from django.core.exceptions import ValidationError
from django.db.models import Count

from games.models import Poll


class PollCloseWriter:
    """Validate a poll is open, resolve its winning option, and mark it closed."""

    def __init__(self, poll, option_id=None):
        """Store the poll being closed and an optional DM/admin-chosen winning option id."""
        self.poll = poll
        self.option_id = option_id

    @classmethod
    def write(cls, poll, option_id=None):
        """Validate `poll` is open, resolve/persist its winning option, and close it."""
        return cls(poll, option_id)._write()

    def _write(self):
        """Validate the poll is open, then persist the resolved winning option."""
        self._validate_open()
        winner = self._resolve_winner()
        self._persist(winner)
        return winner

    def _validate_open(self):
        """Raise ValidationError unless `self.poll` is currently open."""
        if self.poll.status != Poll.STATUS_OPEN:
            raise ValidationError('Poll must be open to be closed.')

    def _resolve_winner(self):
        """Return the winning PollOption: explicitly chosen, or the highest-voted one."""
        if self.option_id is not None:
            return self._validate_explicit_option()
        return self._tally_winner()

    def _validate_explicit_option(self):
        """Return the option for `self.option_id`, raising if it isn't one of the poll's."""
        option = self.poll.options.filter(id=self.option_id).first()
        if option is None:
            raise ValidationError('option_id must belong to the poll.')
        return option

    def _tally_winner(self):
        """Return the option with the most votes, breaking ties by the lowest id."""
        return (
            self.poll.options
            .annotate(vote_count=Count('votes'))
            .order_by('-vote_count', 'id')
            .first()
        )

    def _persist(self, winner):
        """Mark `winner` selected, clear any other selected options, and close the poll."""
        self.poll.options.exclude(id=winner.id).update(selected=False)
        winner.selected = True
        winner.save(update_fields=['selected'])
        self.poll.status = Poll.STATUS_CLOSED
        self.poll.save(update_fields=['status'])
