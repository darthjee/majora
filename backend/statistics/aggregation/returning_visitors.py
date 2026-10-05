"""The earlier-visits lookup telling returning visitors apart from new ones."""

from statistics.models import Visit


class ReturningVisitors:
    """Counts the in-range visitors that already had a visit before the range start."""

    def __init__(self, start_utc, user_ids, anonymous_session_ids):
        """Store the range start and the in-range user ids and anonymous session ids."""
        self._start_utc = start_utc
        self._user_ids = set(user_ids)
        self._session_ids = set(anonymous_session_ids)

    def count(self):
        """Return the number of in-range visitors with an earlier visit (any domain)."""
        return len(self._returning_users()) + len(self._returning_sessions())

    def _earlier_visits(self):
        """Return the visits started before the range, regardless of the session filters."""
        return Visit.objects.filter(started_at__lt=self._start_utc)

    def _returning_users(self):
        """Return the distinct in-range user ids with an earlier visit (no query when empty)."""
        if not self._user_ids:
            return set()
        return set(
            self._earlier_visits()
            .filter(session__user_id__in=self._user_ids)
            .values_list('session__user_id', flat=True)
            .distinct()
        )

    def _returning_sessions(self):
        """Return the distinct anonymous session ids with an earlier visit (no query if empty)."""
        if not self._session_ids:
            return set()
        return set(
            self._earlier_visits()
            .filter(session_id__in=self._session_ids, session__user__isnull=True)
            .values_list('session_id', flat=True)
            .distinct()
        )
