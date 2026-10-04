"""The unique-visitors-over-time series of the staff access statistics."""

from .bucket_calendar import BucketCalendar
from .first_visits import FirstVisits
from .series import Series
from .visit_query import VisitQuery
from .visitor_counts import VisitorCounts

_STARTED_AT = 0
_SESSION_ID = 1
_USER_ID = 2


class VisitorsSeries:
    """Counts the distinct visitors per bucket and in the range, split new / returning."""

    KEYS = ('unique_visitors', 'new_visitors', 'returning_visitors', 'anonymous', 'logged_in')

    def __init__(self, filters):
        """Store the resolved filters and their bucket calendar."""
        self._filters = filters
        self._calendar = BucketCalendar(filters)
        self._first_buckets = {}

    def build(self):
        """Return `(buckets, totals)`: per-bucket and range-level distinct visitor counts."""
        rows = list(VisitQuery(self._filters).rows('started_at', 'session_id', 'session__user_id'))
        self._first_buckets = self._first_buckets_of(rows)
        series = Series(self._calendar).group(rows, lambda row: row[_STARTED_AT])
        return series.map(self._reduce), self._totals(rows)

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

    def _first_buckets_of(self, rows):
        """Return `{key: first_bucket}` of the in-range keys (no lookup without rows)."""
        if not rows:
            return {}
        first_visits = FirstVisits(self._user_ids(rows), self._anonymous_session_ids(rows))
        return {key: self._first_bucket(first) for key, first in first_visits.as_dict().items()}

    def _first_bucket(self, first_visit):
        """Return the bucket of a first visit, or `None` when it is before the range."""
        if first_visit < self._filters.start_utc:
            return None
        return self._calendar.key_for(first_visit)

    def _reduce(self, rows):
        """Return the distinct visitor counts of one bucket's rows (zeros when empty)."""
        bucket_start = self._bucket_start(rows)
        return VisitorCounts(
            self._visitor_keys(rows), lambda key: self._first_buckets.get(key) == bucket_start,
        ).as_dict()

    def _bucket_start(self, rows):
        """Return the bucket key shared by the rows, or `None` for an empty bucket."""
        if not rows:
            return None
        return self._calendar.key_for(rows[0][_STARTED_AT])

    def _totals(self, rows):
        """Return the range-level distinct counts, new meaning no visit before the range."""
        return VisitorCounts(
            self._visitor_keys(rows), lambda key: self._first_buckets.get(key) is not None,
        ).as_dict()
