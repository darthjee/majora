"""The resolved params of the statistics summary endpoint."""

from dataclasses import dataclass

from .filters import StatisticsFilters


@dataclass(frozen=True)
class SummaryParams:
    """The resolved summary params: the `period` name and the rolling window's filters."""

    period: str
    filters: StatisticsFilters

    def as_dict(self):
        """Return the response echo of the resolved `period`, `from`, `to` and `tz`."""
        return {
            'period': self.period,
            'from': self.filters.from_date.isoformat(),
            'to': self.filters.to_date.isoformat(),
            'tz': self.filters.tz.key,
        }
