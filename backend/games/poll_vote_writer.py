"""Persist a user's poll votes, one writer class per poll type's write semantics."""

from django.core.exceptions import ValidationError

from games.models import PollVote


class _PollVoteWriter:
    """Shared plumbing for validating and persisting a user's votes for a poll."""

    def __init__(self, poll, user, option_ids):
        """Store the poll, voting user, and the full set of option ids being cast."""
        self.poll = poll
        self.user = user
        self.option_ids = list(option_ids)

    @classmethod
    def write(cls, poll, user, option_ids):
        """Validate `option_ids`, persist the resulting vote(s), and return them."""
        return cls(poll, user, option_ids)._write()

    def _write(self):
        """Validate the payload, delegate to the type-specific persistence, then return votes."""
        self._validate_option_ids_belong_to_poll()
        self._persist()
        return self._existing_votes()

    def _validate_option_ids_belong_to_poll(self):
        """Raise ValidationError if any requested option id doesn't belong to `self.poll`."""
        valid_ids = set(self.poll.options.values_list('id', flat=True))
        if not set(self.option_ids).issubset(valid_ids):
            raise ValidationError('All option ids must belong to the poll.')

    def _existing_votes(self):
        """Return `self.user`'s current PollVote queryset for `self.poll`."""
        return PollVote.objects.filter(user=self.user, option__poll=self.poll)

    def _persist(self):
        """Persist the vote change(s); implemented by each poll-type-specific subclass."""
        raise NotImplementedError


class SinglePollVoteWriter(_PollVoteWriter):
    """Persist a single-type poll vote: at most one row per user, updated in place."""

    def _persist(self):
        """Create, update in place, or delete the user's single vote row for the poll."""
        self._validate_at_most_one_option()
        existing_vote = self._existing_votes().first()
        if not self.option_ids:
            self._delete_if_present(existing_vote)
            return
        self._upsert(existing_vote, self.option_ids[0])

    def _validate_at_most_one_option(self):
        """Raise ValidationError if more than one option id was submitted."""
        if len(self.option_ids) > 1:
            raise ValidationError('A single-type poll only accepts one option id.')

    def _delete_if_present(self, existing_vote):
        """Delete `existing_vote` if it exists, clearing the user's vote."""
        if existing_vote:
            existing_vote.delete()

    def _upsert(self, existing_vote, option_id):
        """Update `existing_vote`'s option in place, or create a new vote row."""
        if existing_vote:
            existing_vote.option_id = option_id
            existing_vote.save()
        else:
            PollVote.objects.create(user=self.user, option_id=option_id)


class MultiplePollVoteWriter(_PollVoteWriter):
    """Persist a multiple-type poll vote: diff the payload against the user's existing votes."""

    def _persist(self):
        """Create rows for newly selected options, delete rows for deselected ones."""
        current_option_ids = set(self._existing_votes().values_list('option_id', flat=True))
        requested_option_ids = set(self.option_ids)
        self._create_votes(requested_option_ids - current_option_ids)
        self._delete_votes(current_option_ids - requested_option_ids)

    def _create_votes(self, option_ids):
        """Create a new PollVote row for each id in `option_ids`."""
        for option_id in option_ids:
            PollVote.objects.create(user=self.user, option_id=option_id)

    def _delete_votes(self, option_ids):
        """Delete the user's existing votes for each id in `option_ids`."""
        self._existing_votes().filter(option_id__in=option_ids).delete()
