"""A zero-filled time series of grouped rows."""

from collections import defaultdict


class Series:
    """Groups rows into calendar buckets and reduces each bucket, empty ones included."""

    def __init__(self, calendar):
        """Store the bucket calendar and start with no rows."""
        self._calendar = calendar
        self._groups = {}

    def group(self, rows, timestamp_of):
        """Bucket `rows` by `calendar.key_for(timestamp_of(row))`; return `self` for chaining."""
        groups = defaultdict(list)
        for row in rows:
            groups[self._calendar.key_for(timestamp_of(row))].append(row)
        self._groups = groups
        return self

    def map(self, reducer):
        """Return `[{'start', 'end', **reducer(rows)}]` for every bucket, oldest first."""
        return [self._entry(bucket, reducer) for bucket in self._calendar.buckets()]

    def _entry(self, bucket, reducer):
        """Return the serialized entry of one bucket, zero-filled with `reducer([])`."""
        return {
            'start': bucket.start.isoformat(),
            'end': bucket.end.isoformat(),
            **reducer(self._groups.get(bucket.start, [])),
        }
