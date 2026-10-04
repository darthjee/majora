"""The visits-over-time series of the staff access statistics."""

from . import metrics
from .bucket_calendar import BucketCalendar
from .series import Series
from .visit_query import VisitQuery

_STARTED_AT = 0
_USER_ID = 1


class VisitsSeries:
    """Counts the visits per bucket, split into anonymous and logged-in sessions."""

    KEYS = ('anonymous', 'logged_in', 'visits')

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def build(self):
        """Return `(buckets, totals)`: the zero-filled visit counts and their per-key sums."""
        buckets = self._buckets()
        return buckets, self._totals(buckets)

    def _buckets(self):
        """Group the visit rows (one query) by bucket and count them by audience."""
        rows = VisitQuery(self._filters).rows('started_at', 'session__user_id')
        series = Series(BucketCalendar(self._filters))
        return series.group(rows, lambda row: row[_STARTED_AT]).map(self._reduce)

    @staticmethod
    def _reduce(rows):
        """Return the anonymous, logged-in and total visit counts of one bucket's rows."""
        anonymous = metrics.count([row for row in rows if row[_USER_ID] is None])
        logged_in = metrics.count([row for row in rows if row[_USER_ID] is not None])
        return {'anonymous': anonymous, 'logged_in': logged_in, 'visits': anonymous + logged_in}

    @classmethod
    def _totals(cls, buckets):
        """Return the per-key sums of the buckets (all zeros when there are none)."""
        return {key: sum(bucket[key] for bucket in buckets) for key in cls.KEYS}
