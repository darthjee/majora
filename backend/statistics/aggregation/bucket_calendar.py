"""Local-calendar buckets (day / ISO week / month) for a statistics range."""

from datetime import timedelta

from .bucket import Bucket
from .granularity import Granularity

_ONE_DAY = timedelta(days=1)


class BucketCalendar:
    """Lays the requested range out in local calendar buckets and maps timestamps onto them."""

    def __init__(self, filters):
        """Store the resolved filters (range, zone and granularity)."""
        self._filters = filters

    def buckets(self):
        """Return the ordered `Bucket` list covering the range, clipped at both ends."""
        return [self._bucket_starting(start) for start in self._starts()]

    def key_for(self, aware_dt):
        """Return the clipped start date of the bucket holding the aware timestamp."""
        local_day = aware_dt.astimezone(self._filters.tz).date()
        return max(self._period_start(local_day), self._filters.from_date)

    def _starts(self):
        """Yield the clipped start date of every bucket in the range, in order."""
        start = self._filters.from_date
        while start <= self._filters.to_date:
            yield start
            start = self._next_period_start(start)

    def _bucket_starting(self, start):
        """Return the bucket starting at `start`, its end clipped to `to_date`."""
        end = min(self._next_period_start(start) - _ONE_DAY, self._filters.to_date)
        return Bucket(start, end)

    def _period_start(self, day):
        """Return the calendar start (day, ISO Monday or 1st) of the period holding `day`."""
        granularity = self._filters.granularity
        if granularity == Granularity.WEEK:
            return day - timedelta(days=day.weekday())
        if granularity == Granularity.MONTH:
            return day.replace(day=1)
        return day

    def _next_period_start(self, day):
        """Return the calendar start of the period following the one holding `day`."""
        granularity = self._filters.granularity
        if granularity == Granularity.WEEK:
            return self._period_start(day) + timedelta(days=7)
        if granularity == Granularity.MONTH:
            return (day.replace(day=28) + timedelta(days=4)).replace(day=1)
        return day + _ONE_DAY
