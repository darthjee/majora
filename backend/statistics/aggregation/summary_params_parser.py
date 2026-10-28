"""Parses and validates the `period` / `tz` query params of the statistics summary endpoint."""

from datetime import timedelta

from django.utils import timezone

from .filters import StatisticsFilters
from .granularity import Granularity
from .params_parser import parse_tz
from .summary_params import SummaryParams


class SummaryParamsParser:
    """Validates `period` and `tz` only, reporting every error at once; other params are ignored."""

    PERIODS = {'day': 1, 'week': 7, 'month': 30}
    DEFAULT_PERIOD = 'day'

    def __init__(self, query_params, today=None):
        """Store the raw query params and an optional injected `today`."""
        self._params = query_params
        self._today = today
        self._errors = {}

    def parse(self):
        """Return `(summary, errors)`: summary is `None` whenever errors is non-empty."""
        self._errors = {}
        period = self._parse_period()
        tz = self._parse_tz()
        if self._errors:
            return None, self._errors
        return SummaryParams(period=period, filters=self._build_filters(period, tz)), {}

    def _add_error(self, field, code):
        """Record the error `code` for `field`."""
        self._errors.setdefault(field, []).append(code)

    def _parse_period(self):
        """Parse `period` (default `day`), recording `invalid_period` for unknown values."""
        period = self._params.get('period')
        if period is None:
            return self.DEFAULT_PERIOD
        if period not in self.PERIODS:
            self._add_error('period', 'invalid_period')
        return period

    def _parse_tz(self):
        """Parse `tz` with the shared statistics tz parsing (default `UTC`)."""
        zone, code = parse_tz(self._params.get('tz'))
        if code:
            self._add_error('tz', code)
        return zone

    def _build_filters(self, period, tz):
        """Build the `StatisticsFilters` of the rolling window ending today in `tz`."""
        to_date = self._today_in(tz)
        from_date = to_date - timedelta(days=self.PERIODS[period] - 1)
        granularity = Granularity.resolve(Granularity.AUTO, from_date, to_date)
        return StatisticsFilters(
            from_date=from_date, to_date=to_date, tz=tz,
            granularity=granularity, requested_granularity=Granularity.AUTO,
        )

    def _today_in(self, tz):
        """Return the injected `today`, or the current local date in `tz`."""
        return self._today or self._now().astimezone(tz).date()

    @staticmethod
    def _now():
        """Return the current aware UTC datetime (patched in tests to pin "today")."""
        return timezone.now()
