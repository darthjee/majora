"""The headline totals of the staff access statistics overview."""

from . import metrics
from .returning_visitors import ReturningVisitors
from .visit_query import VisitQuery

_STARTED_AT = 0
_LAST_SEEN_AT = 1
_SESSION_ID = 2
_USER_ID = 3


class OverviewTotals:
    """Aggregates the visits of the filtered range into the overview `totals` dict."""

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def build(self):
        """Return the overview totals (one visit query plus the earlier-visits lookup)."""
        rows = list(VisitQuery(self._filters).rows(
            'started_at', 'last_seen_at', 'session_id', 'session__user_id',
        ))
        unique_visitors = metrics.unique(self._visitor_keys(rows))
        returning = self._returning_visitors(rows)
        return {
            'visits': metrics.count(rows),
            'unique_visitors': unique_visitors,
            'logged_in_users': metrics.unique(self._user_ids(rows)),
            'new_visitors': unique_visitors - returning,
            'returning_visitors': returning,
            'average_duration_seconds': self._average_duration(rows),
        }

    @staticmethod
    def _visitor_keys(rows):
        """Return the visitor key of every row."""
        return [VisitQuery.visitor_key(row[_USER_ID], row[_SESSION_ID]) for row in rows]

    @staticmethod
    def _user_ids(rows):
        """Return the non-null user ids of the rows."""
        return [row[_USER_ID] for row in rows if row[_USER_ID] is not None]

    @staticmethod
    def _anonymous_session_ids(rows):
        """Return the session ids of the anonymous rows."""
        return [row[_SESSION_ID] for row in rows if row[_USER_ID] is None]

    def _returning_visitors(self, rows):
        """Return the number of returning visitors, skipping the lookup when there are no rows."""
        if not rows:
            return 0
        return ReturningVisitors(
            self._filters.start_utc, self._user_ids(rows), self._anonymous_session_ids(rows),
        ).count()

    @staticmethod
    def _average_duration(rows):
        """Return the rounded average visit duration in seconds, or `None` without visits."""
        average = metrics.average([
            metrics.duration_seconds(row[_STARTED_AT], row[_LAST_SEEN_AT]) for row in rows
        ])
        return None if average is None else round(average)
