"""The visit-duration series of the staff access statistics."""

from . import metrics
from .bucket_calendar import BucketCalendar
from .series import Series
from .visit_query import VisitQuery

_STARTED_AT = 0
_LAST_SEEN_AT = 1
_HITS = 2


class DurationSeries:
    """Aggregates visit durations and hits per bucket, over the whole range and as a histogram."""

    HISTOGRAM_EDGES = (0, 1, 30, 60, 180, 600, 1800, 3600)

    def __init__(self, filters):
        """Store the resolved filters."""
        self._filters = filters

    def build(self):
        """Return `(buckets, totals, histogram)` computed from a single visit query."""
        rows = list(VisitQuery(self._filters).rows('started_at', 'last_seen_at', 'hits'))
        return self._buckets(rows), self._reduce(rows), self._histogram(rows)

    def _buckets(self, rows):
        """Return the zero-filled per-bucket duration metrics, bucketed by `started_at`."""
        series = Series(BucketCalendar(self._filters))
        return series.group(rows, lambda row: row[_STARTED_AT]).map(self._reduce)

    @classmethod
    def _histogram(cls, rows):
        """Return the duration histogram of all the rows."""
        return metrics.histogram(cls._durations(rows), cls.HISTOGRAM_EDGES)

    @classmethod
    def _reduce(cls, rows):
        """Return the duration and hits metrics of `rows` (`0` / `None` when empty)."""
        durations = cls._durations(rows)
        hits = [row[_HITS] for row in rows]
        return {
            'visits': metrics.count(rows),
            'single_hit_visits': metrics.count([value for value in hits if value == 1]),
            'average_duration_seconds': cls._rounded(metrics.average(durations)),
            'median_duration_seconds': cls._rounded(metrics.median(durations)),
            'average_hits': cls._rounded(metrics.average(hits), 1),
            'median_hits': metrics.median(hits),
        }

    @staticmethod
    def _durations(rows):
        """Return the whole-second duration of every row."""
        return [metrics.duration_seconds(row[_STARTED_AT], row[_LAST_SEEN_AT]) for row in rows]

    @staticmethod
    def _rounded(value, digits=None):
        """Return `value` rounded to `digits` (an int when `None`), keeping `None` as is."""
        return None if value is None else round(value, digits)
