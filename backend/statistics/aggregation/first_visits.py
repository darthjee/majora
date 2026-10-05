"""The first-visit-ever lookup of a set of visitor keys."""

from django.db.models import Min

from statistics.models import Visit

from .visit_query import VisitQuery


class FirstVisits:
    """Finds the first visit ever (any range, any domain) of in-range users and sessions."""

    def __init__(self, user_ids, anonymous_session_ids):
        """Store the in-range user ids and anonymous session ids."""
        self._user_ids = set(user_ids)
        self._session_ids = set(anonymous_session_ids)

    def as_dict(self):
        """Return `{visitor_key: first_started_at}` (no query for an empty id set)."""
        return {**self._first_user_visits(), **self._first_session_visits()}

    def _first_user_visits(self):
        """Return the first visit of every known user, keyed by its visitor key."""
        if not self._user_ids:
            return {}
        rows = (
            Visit.objects.filter(session__user_id__in=self._user_ids)
            .values('session__user_id')
            .annotate(first=Min('started_at'))
        )
        return {
            VisitQuery.visitor_key(row['session__user_id'], None): row['first'] for row in rows
        }

    def _first_session_visits(self):
        """Return the first visit of every known anonymous session, keyed by its visitor key."""
        if not self._session_ids:
            return {}
        rows = (
            Visit.objects.filter(session_id__in=self._session_ids, session__user__isnull=True)
            .values('session_id')
            .annotate(first=Min('started_at'))
        )
        return {VisitQuery.visitor_key(None, row['session_id']): row['first'] for row in rows}
