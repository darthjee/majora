"""Tests for the staff statistics clear view (DELETE /staff/statistics.json)."""

from unittest import TestCase, mock

import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token

from games.tests.factories import SuperUserFactory, UserFactory
from statistics import reset as reset_module
from statistics.models import Session, Visit

URL = '/staff/statistics.json'


@pytest.mark.django_db(transaction=True)
class TestStaffStatisticsClearView:
    """Tests for the DELETE /staff/statistics.json endpoint."""

    def setup_method(self):
        """Set up staff, superuser and regular accounts, and two sessions with visits."""
        self.staff_user = UserFactory(is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff_user)
        self.superuser_token = Token.objects.create(user=SuperUserFactory())
        self.regular_token = Token.objects.create(user=UserFactory())
        for _ in range(2):
            session = Session.objects.create(ip='127.0.0.1')
            Visit.objects.create(session=session)
            Visit.objects.create(session=session)

    def _delete(self, client, token=None):
        """Issue a DELETE request to the endpoint, optionally with a token."""
        return client.delete(URL, **self._auth(token))

    def _auth(self, token):
        """Return the request headers authenticating with `token`, if any."""
        if token is None:
            return {}
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def _failed_delete(self, client):
        """Issue a staff DELETE with the safety limit patched low; return response and logs."""
        client.raise_request_exception = False
        with mock.patch.object(reset_module, 'MAX_BATCHES', 1), \
                mock.patch.object(reset_module.Settings, 'clear_batch_size', return_value=1), \
                TestCase().assertLogs('staff', level='WARNING') as logs:
            response = self._delete(client, token=self.staff_token)
        return response, logs.output

    def test_unauthenticated_returns_401(self, client):
        """Test that an unauthenticated DELETE returns 401."""
        assert self._delete(client).status_code == 401

    def test_non_staff_returns_403(self, client):
        """Test that a regular authenticated user gets a 403 `not_allowed` response."""
        response = self._delete(client, token=self.regular_token)
        assert response.status_code == 403
        assert response.json() == {'errors': {'detail': ['not_allowed']}}

    def test_non_staff_does_not_clear(self, client):
        """Test that a non-staff DELETE leaves the statistics in place."""
        self._delete(client, token=self.regular_token)
        assert Visit.objects.count() >= 4

    def test_staff_returns_200(self, client):
        """Test that a staff user can clear the statistics."""
        assert self._delete(client, token=self.staff_token).status_code == 200

    def test_superuser_returns_200(self, client):
        """Test that a superuser can clear the statistics."""
        assert self._delete(client, token=self.superuser_token).status_code == 200

    def test_get_returns_405(self, client):
        """Test that GET is not allowed."""
        assert client.get(URL, **self._auth(self.staff_token)).status_code == 405

    def test_post_returns_405(self, client):
        """Test that POST is not allowed."""
        assert client.post(URL, **self._auth(self.staff_token)).status_code == 405

    def test_response_counts_include_request_rows(self, client):
        """Test that the counts include the request's own visit and session."""
        response = self._delete(client, token=self.staff_token)
        assert response.json() == {'deleted_visits': 5, 'deleted_sessions': 3}

    def test_clears_previous_rows(self, client):
        """Test that the rows created before the request are all deleted."""
        self._delete(client, token=self.staff_token)
        assert not Visit.objects.exists()

    def test_response_includes_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self._delete(client, token=self.staff_token)
        assert response['X-Skip-Cache'] == 'true'

    def test_success_logs_info_line(self, client):
        """Test that a successful clear logs one INFO `status=success` line."""
        with TestCase().assertLogs('staff', level='INFO') as logs:
            self._delete(client, token=self.staff_token)
        assert len(logs.output) == 1
        assert logs.output[0].startswith(
            'INFO:staff.views.staff_statistics_clear:staff_statistics_clear status=success '
            f'staff_id={self.staff_user.id} deleted_visits=5 deleted_sessions=3 duration_ms='
        )

    def test_limit_exceeded_returns_500(self, client):
        """Test that going over the safety limit returns 500."""
        response, _ = self._failed_delete(client)
        assert response.status_code == 500

    def test_limit_exceeded_logs_warning_line(self, client):
        """Test that going over the safety limit logs one WARNING `status=failed` line."""
        _, output = self._failed_delete(client)
        assert len(output) == 1
        assert output[0].startswith(
            'WARNING:staff.views.staff_statistics_clear:staff_statistics_clear status=failed '
            f'staff_id={self.staff_user.id} deleted_visits=2 deleted_sessions=0 duration_ms='
        )
        assert output[0].endswith(' error=StatisticsResetLimitExceeded')

    def test_url_by_name(self, client):
        """Test that the view is reachable by URL name."""
        url = reverse('staff-statistics-clear')
        assert client.delete(url, **self._auth(self.staff_token)).status_code == 200
