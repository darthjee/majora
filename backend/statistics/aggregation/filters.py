"""The validated, resolved filters of a statistics request."""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


@dataclass(frozen=True)
class StatisticsFilters:
    """Resolved statistics filters: local date range, zone, granularity and session filters."""

    UNKNOWN_DOMAIN = 'unknown'

    from_date: date
    to_date: date
    tz: ZoneInfo
    granularity: str
    requested_granularity: str
    user_id: int | None = None
    domain: int | str | None = None
    audience: str = 'all'

    @property
    def start_utc(self):
        """Return the inclusive UTC start: `from_date` 00:00 in `tz`."""
        return self._local_midnight_utc(self.from_date)

    @property
    def end_utc(self):
        """Return the exclusive UTC end: the day after `to_date`, 00:00 in `tz`."""
        return self._local_midnight_utc(self.to_date + timedelta(days=1))

    def as_dict(self):
        """Return the envelope's `filters` echo of the resolved values."""
        return {
            'from': self.from_date.isoformat(),
            'to': self.to_date.isoformat(),
            'tz': self.tz.key,
            'granularity': self.granularity,
            'requested_granularity': self.requested_granularity,
            'user': self.user_id,
            'domain': self.domain,
            'audience': self.audience,
        }

    def _local_midnight_utc(self, day):
        """Return local midnight of `day` in `tz`, converted to UTC."""
        return datetime.combine(day, time.min, tzinfo=self.tz).astimezone(timezone.utc)
