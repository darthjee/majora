"""Tests for the staff domains summary view (GET /staff/statistics/domains/summary.json)."""

from datetime import datetime, timedelta, timezone

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from domains.tests.factories import DomainFactory, DomainGroupFactory
from games.tests.factories import PlayerFactory, SuperUserFactory, UserFactory
from statistics.models import Session, Visit

URL = '/staff/statistics/domains/summary.json'
RANGE = {'from': '2026-01-01', 'to': '2026-01-03'}
METRICS = {
    'visits', 'anonymous', 'logged_in', 'unique_visitors',
    'average_duration_seconds', 'median_duration_seconds',
}
ZEROS = {
    'visits': 0,
    'anonymous': 0,
    'logged_in': 0,
    'unique_visitors': 0,
    'average_duration_seconds': None,
    'median_duration_seconds': None,
}


def _visit(session, day, seconds=0):
    """Create a visit of `session` started on 2026-01-`day` at noon UTC, lasting `seconds`."""
    started_at = datetime(2026, 1, day, 12, tzinfo=timezone.utc)
    return Visit.objects.create(
        session=session, started_at=started_at,
        last_seen_at=started_at + timedelta(seconds=seconds),
    )


@pytest.mark.django_db
class TestStaffStatisticsDomainsSummaryView:
    """Tests for the GET /staff/statistics/domains/summary.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser, DM and regular accounts, domains and a few visits."""
        self.staff_token = Token.objects.create(user=UserFactory(is_staff=True))
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        dm_user = UserFactory()
        PlayerFactory(user=dm_user, is_dm=True)
        self.dm_token = Token.objects.create(user=dm_user)
        group = DomainGroupFactory(name='Brand')
        self.alpha = DomainFactory(domain='alpha.com', domain_group=group)
        self.beta = DomainFactory(domain='beta.com', domain_group=group)
        anonymous = Session.objects.create(ip='127.0.0.1', domain=self.alpha)
        logged_in = Session.objects.create(ip='127.0.0.1', user=UserFactory(), domain=self.alpha)
        _visit(anonymous, 1)
        _visit(anonymous, 1, 60)
        _visit(logged_in, 2, 30)
        _visit(Session.objects.create(ip='127.0.0.1'), 3, 30)

    def _get(self, client, token=None, **params):
        """Issue a GET request to the endpoint, optionally with a token and query params."""
        extra = {}
        if token is not None:
            extra['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        return client.get(URL, params, **extra)

    def _body(self, client, **params):
        """Return the JSON body of a staff GET over the default range."""
        return self._get(client, token=self.staff_token, **RANGE, **params).json()

    def _ids(self, client, **params):
        """Return the row ids of a staff GET over the default range."""
        return [row['id'] for row in self._body(client, **params)['domains']]

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated GET returns 401."""
        assert self._get(client).status_code == 401

    def test_non_staff_returns_403(self, client):
        """Test that a regular authenticated user gets a 403 response."""
        assert self._get(client, token=self.regular_token).status_code == 403

    def test_dm_returns_403(self, client):
        """Test that a game DM without staff rights gets a 403 response."""
        assert self._get(client, token=self.dm_token).status_code == 403

    def test_unauthenticated_with_invalid_params_returns_401(self, client):
        """Test that authentication is checked before the params are validated."""
        assert self._get(client, domain='abc').status_code == 401

    def test_non_staff_with_invalid_params_returns_403(self, client):
        """Test that authorisation is checked before the params are validated."""
        response = self._get(client, token=self.regular_token, domain='abc')
        assert response.status_code == 403
        assert 'domain' not in response.json()['errors']

    def test_staff_gets_200(self, client):
        """Test that staff can read the domains summary."""
        assert self._get(client, token=self.staff_token, **RANGE).status_code == 200

    def test_superuser_gets_200(self, client):
        """Test that a superuser can read the domains summary."""
        assert self._get(client, token=self.superuser_token, **RANGE).status_code == 200

    def test_invalid_params_return_400(self, client):
        """Test that every invalid param is reported at once in `errors`."""
        response = self._get(
            client, token=self.staff_token, **{'from': 'nope'}, domain='abc', audience='bots',
        )
        assert response.status_code == 400
        errors = response.json()['errors']
        assert errors['domain'] == ['invalid_domain']
        assert errors['audience'] == ['invalid_audience']
        assert 'from' in errors

    def test_envelope_keys(self, client):
        """Test that the response holds exactly the filters, domains and totals."""
        assert set(self._body(client)) == {'filters', 'domains', 'totals'}

    def test_filters_echo(self, client):
        """Test that the resolved filters are echoed."""
        assert self._body(client, tz='UTC')['filters'] == {
            'from': '2026-01-01', 'to': '2026-01-03', 'tz': 'UTC',
            'granularity': 'day', 'requested_granularity': 'auto',
            'user': None, 'domain': None, 'audience': 'all',
        }

    def test_rows(self, client):
        """Test the rows: configured domains by visits, then the unknown row."""
        assert self._body(client)['domains'] == [
            {'id': self.alpha.id, 'domain': 'alpha.com', 'group': 'Brand', 'visits': 3,
             'anonymous': 2, 'logged_in': 1, 'unique_visitors': 2,
             'average_duration_seconds': 30, 'median_duration_seconds': 30},
            {'id': self.beta.id, 'domain': 'beta.com', 'group': 'Brand', **ZEROS},
            {'id': 'unknown', 'domain': None, 'group': None, 'visits': 1, 'anonymous': 1,
             'logged_in': 0, 'unique_visitors': 1,
             'average_duration_seconds': 30, 'median_duration_seconds': 30},
        ]

    def test_totals(self, client):
        """Test that the totals are computed over all matched visits."""
        assert self._body(client)['totals'] == {
            'visits': 4, 'anonymous': 3, 'logged_in': 1, 'unique_visitors': 3,
            'average_duration_seconds': 30, 'median_duration_seconds': 30,
        }

    def test_row_keys(self, client):
        """Test that every row has the identity keys plus the six metrics."""
        for row in self._body(client)['domains']:
            assert set(row) == {'id', 'domain', 'group'} | METRICS

    def test_granularity_is_echoed_without_changing_rows(self, client):
        """Test that `granularity=month` is echoed while the rows are unchanged."""
        body = self._body(client, granularity='month')
        assert body['filters']['granularity'] == 'month'
        assert body['domains'] == self._body(client)['domains']

    def test_domain_id_keeps_that_row(self, client):
        """Test that `domain=<id>` returns that row only."""
        assert self._ids(client, domain=self.beta.id) == [self.beta.id]

    def test_missing_domain_id_is_empty(self, client):
        """Test that a missing domain id returns no rows and zero totals."""
        body = self._body(client, domain=999999)
        assert body['domains'] == []
        assert body['totals'] == ZEROS

    def test_unknown_domain_keeps_unknown_row(self, client):
        """Test that `domain=unknown` returns only the unknown row."""
        assert self._ids(client, domain='unknown') == ['unknown']

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._get(client, token=self.staff_token, **RANGE)
        assert response['X-Skip-Cache'] == 'true'

    def test_post_is_not_allowed(self, client):
        """Test that a POST is rejected with 405."""
        response = client.post(URL, HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
        assert response.status_code == 405

    def test_url_by_name(self, client):
        """Test that the view is accessible by URL name."""
        url = reverse('staff-statistics-domains-summary')
        assert url == URL
        response = client.get(url, RANGE, HTTP_AUTHORIZATION=f'Token {self.superuser_token.key}')
        assert response.status_code == 200
