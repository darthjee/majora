"""Closing processor for polls linked to a `GameSession`."""

import datetime

from django.core.exceptions import ValidationError


class GameSessionCloseProcessor:
    """Apply a closed poll's winning option to its linked `GameSession`."""

    @classmethod
    def process(cls, session, winner):
        """Parse `winner.option` as an ISO date and save it as `session`'s date."""
        session.date = cls._parse_date(winner.option)
        session.save(update_fields=['date'])

    @classmethod
    def _parse_date(cls, option):
        """Return `option` parsed as an ISO date, raising ValidationError if it can't be."""
        try:
            return datetime.date.fromisoformat(option)
        except ValueError as exc:
            raise ValidationError(f'Winning option {option!r} is not a valid ISO date.') from exc
