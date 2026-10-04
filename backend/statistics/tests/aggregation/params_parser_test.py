"""Tests for `statistics.aggregation.params_parser.StatisticsParamsParser`."""

from datetime import date

from django.http import QueryDict

from statistics.aggregation import StatisticsParamsParser

TODAY = date(2026, 3, 31)


def _parse(params=None, today=TODAY):
    """Parse `params` (a dict) with an injected `today`."""
    return StatisticsParamsParser(params or {}, today=today).parse()


def _errors(params):
    """Return only the errors of parsing `params`."""
    return _parse(params)[1]


class TestStatisticsParamsParserDefaults:
    """Tests for the defaults applied when params are omitted."""

    def setup_method(self):
        """Parse an empty query."""
        self.filters, self.errors = _parse()

    def test_has_no_errors(self):
        """Test that an empty query is valid."""
        assert self.errors == {}

    def test_to_defaults_to_today(self):
        """Test that `to` defaults to the injected today."""
        assert self.filters.to_date == TODAY

    def test_from_defaults_to_29_days_before_to(self):
        """Test that `from` defaults to `to − 29 days` (a 30-day range)."""
        assert self.filters.from_date == date(2026, 3, 2)

    def test_tz_defaults_to_utc(self):
        """Test that `tz` defaults to UTC."""
        assert self.filters.tz.key == 'UTC'

    def test_granularity_defaults_to_auto_resolved(self):
        """Test that `granularity` defaults to `auto`, resolved to days for 30 days."""
        assert self.filters.requested_granularity == 'auto'
        assert self.filters.granularity == 'day'

    def test_audience_defaults_to_all(self):
        """Test that `audience` defaults to `all`."""
        assert self.filters.audience == 'all'

    def test_user_and_domain_default_to_none(self):
        """Test that `user` and `domain` default to none."""
        assert self.filters.user_id is None
        assert self.filters.domain is None

    def test_from_defaults_relative_to_explicit_to(self):
        """Test that the default `from` is computed from an explicit `to`."""
        filters, _ = _parse({'to': '2026-01-30'})
        assert filters.from_date == date(2026, 1, 1)

    def test_today_defaults_to_local_date(self):
        """Test that without an injected today the range ends on a real date."""
        filters, errors = StatisticsParamsParser({'tz': 'Pacific/Kiritimati'}).parse()
        assert errors == {}
        assert isinstance(filters.to_date, date)


class TestStatisticsParamsParserValidValues:
    """Tests for explicitly provided valid params."""

    def test_parses_every_param(self):
        """Test that every param is parsed into the filters."""
        filters, errors = _parse({
            'from': '2026-01-01', 'to': '2026-03-31', 'tz': 'Europe/Lisbon',
            'granularity': 'month', 'user': '4', 'domain': '9', 'audience': 'logged_in',
        })
        assert errors == {}
        assert filters.as_dict() == {
            'from': '2026-01-01', 'to': '2026-03-31', 'tz': 'Europe/Lisbon',
            'granularity': 'month', 'requested_granularity': 'month',
            'user': 4, 'domain': 9, 'audience': 'logged_in',
        }

    def test_auto_resolves_to_week(self):
        """Test that `auto` resolves to weeks for a 90-day range."""
        filters, _ = _parse({'from': '2026-01-01', 'to': '2026-03-31'})
        assert filters.granularity == 'week'

    def test_domain_unknown(self):
        """Test that `domain=unknown` is kept as the string `unknown`."""
        filters, errors = _parse({'domain': 'unknown'})
        assert errors == {}
        assert filters.domain == 'unknown'

    def test_user_with_anonymous_audience_is_valid(self):
        """Test that `user` combined with `audience=anonymous` is not an error."""
        _, errors = _parse({'user': '1', 'audience': 'anonymous'})
        assert errors == {}

    def test_valid_page_and_per_page(self):
        """Test that positive `page` and `per_page` up to 100 are accepted."""
        assert _errors({'page': '3', 'per_page': '100'}) == {}

    def test_unknown_params_are_ignored(self):
        """Test that unknown params neither error nor change the filters."""
        filters, errors = _parse({'sort': 'whatever', 'foo': 'bar'})
        assert errors == {}
        assert filters.audience == 'all'

    def test_accepts_a_query_dict(self):
        """Test that a Django `QueryDict` is accepted as the params source."""
        filters, errors = _parse(QueryDict('audience=anonymous&user=2'))
        assert errors == {}
        assert filters.user_id == 2


class TestStatisticsParamsParserRangeCap:
    """Tests for the inclusive range cap."""

    def test_366_days_is_accepted(self):
        """Test that a 366-day range (the default cap) is valid."""
        assert _errors({'from': '2025-04-01', 'to': '2026-04-01'}) == {}

    def test_367_days_is_rejected(self):
        """Test that a 367-day range exceeds the default cap."""
        errors = _errors({'from': '2025-03-31', 'to': '2026-04-01'})
        assert errors == {'range': ['range_too_long']}

    def test_cap_follows_the_setting(self, monkeypatch):
        """Test that the cap is read from `MAJORA_STATISTICS_MAX_RANGE_DAYS`."""
        monkeypatch.setenv('MAJORA_STATISTICS_MAX_RANGE_DAYS', '7')
        errors = _errors({'from': '2026-01-01', 'to': '2026-01-08'})
        assert errors == {'range': ['range_too_long']}

    def test_single_day_is_accepted(self):
        """Test that `from == to` is a valid one-day range."""
        assert _errors({'from': '2026-01-01', 'to': '2026-01-01'}) == {}


class TestStatisticsParamsParserErrors:
    """Tests for each validation error code."""

    def test_invalid_from_date(self):
        """Test that a malformed `from` yields `invalid_date`."""
        assert _errors({'from': '2026/01/01'}) == {'from': ['invalid_date']}

    def test_invalid_to_date(self):
        """Test that an impossible `to` date yields `invalid_date`."""
        assert _errors({'to': '2026-02-30'}) == {'to': ['invalid_date']}

    def test_compact_iso_date_is_rejected(self):
        """Test that the compact ISO form `YYYYMMDD` is rejected."""
        assert _errors({'from': '20260101'}) == {'from': ['invalid_date']}

    def test_from_after_to(self):
        """Test that `from > to` yields `from_after_to` on the `range` key."""
        errors = _errors({'from': '2026-02-02', 'to': '2026-02-01'})
        assert errors == {'range': ['from_after_to']}

    def test_invalid_timezone(self):
        """Test that an unknown zone yields `invalid_timezone`."""
        assert _errors({'tz': 'Mars/Olympus'}) == {'tz': ['invalid_timezone']}

    def test_invalid_granularity(self):
        """Test that an unknown granularity yields `invalid_granularity`."""
        assert _errors({'granularity': 'year'}) == {'granularity': ['invalid_granularity']}

    def test_invalid_audience(self):
        """Test that an unknown audience yields `invalid_audience`."""
        assert _errors({'audience': 'bots'}) == {'audience': ['invalid_audience']}

    def test_non_numeric_user(self):
        """Test that a non-numeric `user` yields `invalid_user`."""
        assert _errors({'user': 'abc'}) == {'user': ['invalid_user']}

    def test_zero_user(self):
        """Test that `user=0` yields `invalid_user`."""
        assert _errors({'user': '0'}) == {'user': ['invalid_user']}

    def test_negative_user(self):
        """Test that a negative `user` yields `invalid_user`."""
        assert _errors({'user': '-1'}) == {'user': ['invalid_user']}

    def test_invalid_domain(self):
        """Test that a non-numeric `domain` other than `unknown` yields `invalid_domain`."""
        assert _errors({'domain': 'example.com'}) == {'domain': ['invalid_domain']}

    def test_zero_domain(self):
        """Test that `domain=0` yields `invalid_domain`."""
        assert _errors({'domain': '0'}) == {'domain': ['invalid_domain']}

    def test_invalid_page(self):
        """Test that a non-positive `page` yields `invalid_page`."""
        assert _errors({'page': '0'}) == {'page': ['invalid_page']}

    def test_non_numeric_per_page(self):
        """Test that a non-numeric `per_page` yields `invalid_per_page`."""
        assert _errors({'per_page': 'ten'}) == {'per_page': ['invalid_per_page']}

    def test_per_page_above_maximum(self):
        """Test that `per_page > 100` yields `invalid_per_page`."""
        assert _errors({'per_page': '101'}) == {'per_page': ['invalid_per_page']}

    def test_filters_are_none_on_error(self):
        """Test that no filters are returned when there are errors."""
        filters, _ = _parse({'audience': 'bots'})
        assert filters is None


class TestStatisticsParamsParserMultipleErrors:
    """Tests for reporting every error at once."""

    def test_reports_every_error(self):
        """Test that every invalid param is reported in a single parse."""
        errors = _errors({
            'from': 'bad', 'to': 'worse', 'tz': 'Nowhere', 'granularity': 'year',
            'audience': 'bots', 'user': 'x', 'domain': 'y', 'page': '-2', 'per_page': '500',
        })
        assert errors == {
            'from': ['invalid_date'],
            'to': ['invalid_date'],
            'tz': ['invalid_timezone'],
            'granularity': ['invalid_granularity'],
            'audience': ['invalid_audience'],
            'user': ['invalid_user'],
            'domain': ['invalid_domain'],
            'page': ['invalid_page'],
            'per_page': ['invalid_per_page'],
        }

    def test_range_error_reported_with_other_errors(self):
        """Test that a range error is reported alongside other field errors."""
        errors = _errors({'from': '2026-02-02', 'to': '2026-02-01', 'audience': 'bots'})
        assert errors == {'range': ['from_after_to'], 'audience': ['invalid_audience']}

    def test_range_checks_skipped_when_from_fails(self):
        """Test that no range error is reported when `from` fails to parse."""
        assert _errors({'from': 'nope', 'to': '2026-01-01'}) == {'from': ['invalid_date']}

    def test_range_checks_skipped_when_to_fails(self):
        """Test that no range error is reported when `to` fails to parse."""
        assert _errors({'from': '2020-01-01', 'to': 'nope'}) == {'to': ['invalid_date']}
