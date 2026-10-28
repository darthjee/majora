"""Tests for the staff statistics summary view (GET /staff/statistics/summary.json)."""

from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from rest_framework.authtoken.models import Token

from games.tests.factories import PlayerFactory, SuperUserFactory, UserFactory
from statistics.aggregation import SummaryParamsParser
from statistics.models import Session, Visit

URL = '/staff/statistics/summary.json'
OVERVIEW_URL = '/staff/statistics/overview.json'
NOW = datetime(2026, 3, 31, 12, tzinfo=timezone.utc)


def _utc(month, day, hour=12, minute=0):
    """Return an aware UTC datetime in 2026."""
    return datetime(2026, month, day, hour, minute, tzinfo=timezone.utc)


def _visit(started_at, user=None, session=None):
    """Create a visit started at `started_at`, on `session` or a new session of `user`."""
    session = session or Session.objects.create(ip='127.0.0.1', user=user)
    return Visit.objects.create(session=session, started_at=started_at, last_seen_at=started_at)


class _SummaryRequests:
    """Shared request helpers: staff token and `GET` with "today" pinned at `NOW`."""

    def _create_staff_token(self):
        """Create the staff token used by the successful requests."""
        self.staff_token = Token.objects.create(user=UserFactory(is_staff=True))

    def _get(self, client, token=None, url=URL, **params):
        """Issue a GET request with "today" pinned at `NOW`, optionally with a token."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        with patch.object(SummaryParamsParser, '_now', return_value=NOW):
            return client.get(url, params, **extra)

    def _body(self, client, **params):
        """Return the JSON body of a staff GET request."""
        return self._get(client, token=self.staff_token, **params).json()

    def _count(self, client, **params):
        """Return the `unique_visitors` of a staff GET request."""
        return self._body(client, **params)['unique_visitors']


@pytest.mark.django_db
class TestStaffStatisticsSummaryAccess(_SummaryRequests):
    """Tests for the access control of the summary endpoint."""

    def setup_method(self):
        """Set up staff, superuser, DM and regular accounts."""
        self._create_staff_token()
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        dm_user = UserFactory()
        PlayerFactory(user=dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=dm_user)

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        assert self._get(client).status_code == 401

    def test_non_staff_returns_403(self, client):
        """Test that a regular user gets 403 `not_allowed`."""
        response = self._get(client, token=self.regular_token)
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': ['not_allowed']}}

    def test_dm_returns_403(self, client):
        """Test that a game DM without staff rights gets 403 `not_allowed`."""
        response = self._get(client, token=self.dm_token)
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': ['not_allowed']}}

    def test_non_staff_with_invalid_params_returns_403(self, client):
        """Test that authorisation is checked before the params are validated."""
        assert self._get(client, token=self.regular_token, period='year').status_code == 403

    def test_staff_gets_200(self, client):
        """Test that staff can read the summary."""
        assert self._get(client, token=self.staff_token).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the summary."""
        assert self._get(client, token=self.superuser_token).status_code == 200

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        assert self._get(client, token=self.staff_token)['X-Skip-Cache'] == 'true'

    def test_post_is_not_allowed(self, client):
        """Test that POST returns 405."""
        response = client.post(URL, HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
        assert response.status_code == 405


@pytest.mark.django_db
class TestStaffStatisticsSummaryParams(_SummaryRequests):
    """Tests for the params handling of the summary endpoint."""

    def setup_method(self):
        """Set up a staff account."""
        self._create_staff_token()

    def test_defaults_are_echoed(self, client):
        """Test that the defaults `period=day` and `tz=UTC` are echoed."""
        assert self._body(client) == {
            'period': 'day', 'from': '2026-03-31', 'to': '2026-03-31', 'tz': 'UTC',
            'unique_visitors': 0,
        }

    def test_resolved_values_are_echoed(self, client):
        """Test that the period, window dates and zone are echoed."""
        body = self._body(client, period='week', tz='America/Sao_Paulo')
        assert body == {
            'period': 'week', 'from': '2026-03-25', 'to': '2026-03-31',
            'tz': 'America/Sao_Paulo', 'unique_visitors': 0,
        }

    def test_invalid_period_returns_400(self, client):
        """Test that an invalid `period` returns 400 `invalid_period`."""
        response = self._get(client, token=self.staff_token, period='year')
        assert response.status_code == 400
        assert response.json() == {'errors': {'period': ['invalid_period']}}

    def test_invalid_tz_returns_400(self, client):
        """Test that an invalid `tz` returns 400 `invalid_timezone`."""
        response = self._get(client, token=self.staff_token, tz='Nowhere')
        assert response.status_code == 400
        assert response.json() == {'errors': {'tz': ['invalid_timezone']}}

    def test_both_invalid_return_combined_errors(self, client):
        """Test that both errors are returned in the same `errors` object."""
        response = self._get(client, token=self.staff_token, period='year', tz='Nowhere')
        assert response.status_code == 400
        assert response.json() == {
            'errors': {'period': ['invalid_period'], 'tz': ['invalid_timezone']},
        }

    def test_other_params_are_ignored(self, client):
        """Test that other statistics params are neither read nor validated."""
        response = self._get(
            client, token=self.staff_token, **{'from': 'bad', 'granularity': 'bad'},
        )
        assert response.status_code == 200
        assert response.json()['from'] == '2026-03-31'


@pytest.mark.django_db
class TestStaffStatisticsSummaryPeriods(_SummaryRequests):
    """Tests for the rolling windows of each period, in UTC."""

    def setup_method(self):
        """Set up a staff account and visits around each window's bounds."""
        self._create_staff_token()
        _visit(_utc(3, 31, hour=23, minute=59))
        _visit(_utc(3, 31, hour=0))
        _visit(_utc(3, 30, hour=23, minute=59))
        _visit(_utc(3, 25, hour=0))
        _visit(_utc(3, 24, hour=23, minute=59))
        _visit(_utc(3, 2, hour=0))
        _visit(_utc(3, 1, hour=23, minute=59))

    def test_day(self, client):
        """Test that `day` counts today's first and last instants only."""
        assert self._count(client, period='day') == 2

    def test_week(self, client):
        """Test that `week` counts `[today − 6, today]` only."""
        assert self._count(client, period='week') == 4

    def test_month(self, client):
        """Test that `month` counts `[today − 29, today]` only."""
        assert self._count(client, period='month') == 6

    def test_empty_window_returns_zero(self, client):
        """Test that a window without visits returns `unique_visitors: 0`."""
        Visit.objects.all().delete()
        assert self._count(client, period='month') == 0


@pytest.mark.django_db
class TestStaffStatisticsSummaryVisitors(_SummaryRequests):
    """Tests for the visitor identity rules of the summary endpoint."""

    def setup_method(self):
        """Set up a staff account and a user with several sessions plus anonymous sessions."""
        self._create_staff_token()
        user = UserFactory()
        _visit(_utc(3, 31, hour=8), user=user)
        _visit(_utc(3, 31, hour=9), user=user)
        anonymous = Session.objects.create(ip='127.0.0.1')
        _visit(_utc(3, 31, hour=8), session=anonymous)
        _visit(_utc(3, 31, hour=9), session=anonymous)
        _visit(_utc(3, 31, hour=10))

    def test_counts_logged_in_and_anonymous_visitors(self, client):
        """Test that one user and two anonymous sessions count three visitors."""
        assert self._count(client) == 3


@pytest.mark.django_db
class TestStaffStatisticsSummaryTimezone(_SummaryRequests):
    """Tests for the local-day window in `tz`, across the Europe/London DST start (03-29)."""

    def setup_method(self):
        """Set up a staff account and visits around the London week window's bounds."""
        self._create_staff_token()
        _visit(_utc(3, 24, hour=23, minute=59))
        _visit(_utc(3, 25, hour=0))
        _visit(_utc(3, 31, hour=22, minute=59))
        _visit(_utc(3, 31, hour=23))

    def test_window_follows_local_days_across_dst(self, client):
        """Test that the window starts at 00:00 GMT and ends at local midnight BST (23:00 UTC)."""
        assert self._count(client, period='week', tz='Europe/London') == 2

    def test_utc_window_differs(self, client):
        """Test that the same visits in UTC include the 23:00 UTC visit."""
        assert self._count(client, period='week', tz='UTC') == 3

    def test_local_window_shifts_with_offset(self, client):
        """Test that a negative offset zone shifts the window later."""
        assert self._count(client, period='day', tz='America/Sao_Paulo') == 2


@pytest.mark.django_db
class TestStaffStatisticsSummaryOverviewInvariant(_SummaryRequests):
    """Tests that `unique_visitors` matches `overview.json` for the same window."""

    def setup_method(self):
        """Set up a staff account and a mix of visitors around the window."""
        self._create_staff_token()
        user = UserFactory()
        _visit(_utc(3, 20), user=user)
        _visit(_utc(3, 26), user=user)
        _visit(_utc(3, 27), user=user)
        _visit(_utc(3, 28))
        _visit(_utc(3, 31, hour=23, minute=30))
        _visit(_utc(3, 24, hour=23, minute=30))

    @pytest.mark.parametrize('period', ['day', 'week', 'month'])
    @pytest.mark.parametrize('tz', ['UTC', 'Europe/London', 'America/Sao_Paulo'])
    def test_matches_overview(self, client, period, tz):
        """Test that the count equals `overview.json`'s `totals.unique_visitors`."""
        summary = self._body(client, period=period, tz=tz)
        overview = self._get(
            client, token=self.staff_token, url=OVERVIEW_URL,
            **{'from': summary['from'], 'to': summary['to'], 'tz': summary['tz']},
        ).json()
        assert summary['unique_visitors'] == overview['totals']['unique_visitors']
