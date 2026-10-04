"""Parses and validates the shared statistics query params."""

import re
from datetime import date, datetime, timedelta
from functools import lru_cache
from zoneinfo import ZoneInfo, available_timezones

from statistics.settings import Settings

from .filters import StatisticsFilters
from .granularity import Granularity

_DATE_PATTERN = re.compile(r'^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
_POSITIVE_INT_PATTERN = re.compile(r'^[0-9]+$')


@lru_cache(maxsize=1)
def _timezones():
    """Return the (cached) set of valid IANA zone names."""
    return frozenset(available_timezones())


class StatisticsParamsParser:
    """Validates statistics query params, reporting every error at once."""

    AUDIENCES = ('all', 'anonymous', 'logged_in')
    DEFAULT_SPAN_DAYS = 30
    MAX_PER_PAGE = 100

    def __init__(self, query_params, today=None):
        """Store the raw query params and an optional injected `today`."""
        self._params = query_params
        self._today = today
        self._errors = {}

    def parse(self):
        """Return `(filters, errors)`: filters is `None` whenever errors is non-empty."""
        self._errors = {}
        values = self._parse_values()
        if self._errors:
            return None, self._errors
        return self._build_filters(values), {}

    def _parse_values(self):
        """Parse every param, collecting errors, and return the parsed values."""
        tz = self._parse_tz()
        values = {
            'tz': tz,
            'requested_granularity': self._parse_granularity(),
            'audience': self._parse_audience(),
            'user_id': self._parse_user(),
            'domain': self._parse_domain(),
        }
        self._parse_page()
        self._parse_per_page()
        values['from_date'], values['to_date'] = self._parse_dates(tz)
        return values

    def _build_filters(self, values):
        """Build the `StatisticsFilters`, resolving the granularity."""
        granularity = Granularity.resolve(
            values['requested_granularity'], values['from_date'], values['to_date'],
        )
        return StatisticsFilters(granularity=granularity, **values)

    def _get(self, key):
        """Return the raw value of `key`, or `None` when absent."""
        return self._params.get(key)

    def _add_error(self, field, code):
        """Record the error `code` for `field`."""
        self._errors.setdefault(field, []).append(code)

    def _parse_tz(self):
        """Parse `tz` (default `UTC`); fall back to UTC after recording an error."""
        name = self._get('tz')
        if name is None:
            return ZoneInfo('UTC')
        if name not in _timezones():
            self._add_error('tz', 'invalid_timezone')
            return ZoneInfo('UTC')
        return ZoneInfo(name)

    def _parse_choice(self, key, choices, default, code):
        """Parse an enum param, recording `code` when it is not one of `choices`."""
        value = self._get(key)
        if value is None:
            return default
        if value not in choices:
            self._add_error(key, code)
        return value

    def _parse_granularity(self):
        """Parse `granularity` (default `auto`)."""
        return self._parse_choice(
            'granularity', Granularity.CHOICES, Granularity.AUTO, 'invalid_granularity',
        )

    def _parse_audience(self):
        """Parse `audience` (default `all`)."""
        return self._parse_choice('audience', self.AUDIENCES, 'all', 'invalid_audience')

    def _parse_user(self):
        """Parse `user` as a positive integer (default none)."""
        value = self._get('user')
        if value is None:
            return None
        return self._positive_int_or_error('user', value, 'invalid_user')

    def _parse_domain(self):
        """Parse `domain` as a positive integer or `unknown` (default none)."""
        value = self._get('domain')
        if value is None or value == StatisticsFilters.UNKNOWN_DOMAIN:
            return value
        return self._positive_int_or_error('domain', value, 'invalid_domain')

    def _parse_page(self):
        """Validate `page` as a positive integer, when present."""
        value = self._get('page')
        if value is not None:
            self._positive_int_or_error('page', value, 'invalid_page')

    def _parse_per_page(self):
        """Validate `per_page` as a positive integer up to `MAX_PER_PAGE`, when present."""
        value = self._get('per_page')
        if value is None:
            return
        number = self._positive_int(value)
        if number is None or number > self.MAX_PER_PAGE:
            self._add_error('per_page', 'invalid_per_page')

    def _positive_int_or_error(self, field, value, code):
        """Return `value` as a positive integer, or record `code` and return `None`."""
        number = self._positive_int(value)
        if number is None:
            self._add_error(field, code)
        return number

    @staticmethod
    def _positive_int(value):
        """Return `value` as an integer when it is a positive decimal integer, else `None`."""
        if not _POSITIVE_INT_PATTERN.match(value):
            return None
        number = int(value)
        return number if number > 0 else None

    def _parse_dates(self, tz):
        """Parse `from` / `to` with their defaults, then run the range checks."""
        to_date = self._parse_date('to', self._today_in(tz))
        default_from = self._default_from(to_date)
        from_date = self._parse_date('from', default_from)
        if from_date and to_date:
            self._check_range(from_date, to_date)
        return from_date, to_date

    def _default_from(self, to_date):
        """Return the default `from` (`to − 29 days`), or `None` when `to` is invalid."""
        if to_date is None:
            return None
        return to_date - timedelta(days=self.DEFAULT_SPAN_DAYS - 1)

    def _today_in(self, tz):
        """Return the injected `today`, or the current local date in `tz`."""
        return self._today or datetime.now(tz).date()

    def _parse_date(self, field, default):
        """Parse a `YYYY-MM-DD` param, recording `invalid_date` on failure."""
        value = self._get(field)
        if value is None:
            return default
        parsed = self._iso_date(value)
        if parsed is None:
            self._add_error(field, 'invalid_date')
        return parsed

    @staticmethod
    def _iso_date(value):
        """Return `value` as a date when it is a valid `YYYY-MM-DD` string, else `None`."""
        if not _DATE_PATTERN.match(value):
            return None
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None

    def _check_range(self, from_date, to_date):
        """Record `from_after_to` or `range_too_long` on the `range` key."""
        if from_date > to_date:
            self._add_error('range', 'from_after_to')
        elif (to_date - from_date).days + 1 > Settings.max_range_days():
            self._add_error('range', 'range_too_long')
