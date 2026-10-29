"""Access matrix tests for GET /staff/statistics/export.json (and its sibling routes)."""

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import ApiToken, UserProfile
from accounts.tests.api_tokens.support import legacy_token_client, session_client
from games.tests.factories import GameFactory, SuperUserFactory, UserFactory, UserProfileFactory
from majora_project.cache import memory_cache
from staff.tests.statistics_export_support import RANGE, URL, bearer_client

SIBLING_URL = '/staff/statistics/visits.json'
CLEAR_URL = '/staff/statistics.json'


def _detail(response):
    """Return the error codes of `response`'s `detail` key."""
    return response.json()['errors']['detail']


@pytest.mark.django_db
class TestStaffStatisticsExportAccess:
    """Every row of the export access matrix, on the export, a sibling and the clear routes."""

    def setup_method(self):
        """Set up a staff owner and a regular user."""
        memory_cache.clear()
        self.staff = UserFactory(is_staff=True)
        self.regular = UserFactory()

    def _assert(self, response, status, code=None):
        """Assert the `status` of `response` and, when given, its `detail` error `code`."""
        assert response.status_code == status
        if code is not None:
            assert _detail(response) == [code]

    def _all(self, client):
        """Return the export, sibling and clear responses for `client`."""
        return (
            client.get(URL, RANGE),
            client.get(SIBLING_URL, RANGE),
            client.delete(CLEAR_URL),
        )

    def test_url_name(self):
        """Test that `staff-statistics-export` reverses to the endpoint URL."""
        assert reverse('staff-statistics-export') == URL

    def test_anonymous(self):
        """Test that an anonymous caller gets 401 everywhere."""
        for response in self._all(APIClient()):
            self._assert(response, 401)

    @pytest.mark.parametrize('client_factory', [session_client, legacy_token_client])
    def test_non_staff(self, client_factory):
        """Test that a logged-in non-staff caller gets 403 not_allowed everywhere."""
        for response in self._all(client_factory(self.regular)):
            self._assert(response, 403, 'not_allowed')

    @pytest.mark.parametrize('client_factory', [session_client, legacy_token_client])
    def test_staff_reads_export(self, client_factory):
        """Test that a staff caller (browser or legacy token) reads the export."""
        self._assert(client_factory(self.staff).get(URL, RANGE), 200)

    def test_superuser_reads_export(self):
        """Test that a superuser reads the export."""
        self._assert(session_client(SuperUserFactory()).get(URL, RANGE), 200)

    def test_staff_keeps_sibling_and_clear(self):
        """Test that a staff browser still reads the sibling route and clears statistics."""
        export, sibling, clear = self._all(session_client(self.staff))
        assert sibling.status_code == 200
        assert clear.status_code == 200

    def test_token_without_scope(self):
        """Test that a token lacking statistics:read gets scope_missing on the export only."""
        export, sibling, clear = self._all(bearer_client(self.staff, ['npcs:read']))
        self._assert(export, 403, 'scope_missing')
        self._assert(sibling, 403, 'token_not_allowed')
        self._assert(clear, 403, 'token_not_allowed')

    def test_token_with_scope_staff_owner(self):
        """Test that a staff-owned statistics:read token reads the export only."""
        export, sibling, clear = self._all(bearer_client(self.staff, ['statistics:read']))
        self._assert(export, 200)
        self._assert(sibling, 403, 'token_not_allowed')
        self._assert(clear, 403, 'token_not_allowed')

    def test_token_with_scope_non_staff_owner(self):
        """Test that a non-staff-owned statistics:read token gets not_allowed on the export."""
        export, sibling, clear = self._all(bearer_client(self.regular, ['statistics:read']))
        self._assert(export, 403, 'not_allowed')
        self._assert(sibling, 403, 'token_not_allowed')
        self._assert(clear, 403, 'token_not_allowed')

    def test_token_owner_demoted_after_granting(self):
        """Test that a staff owner demoted later keeps the scope but gets not_allowed."""
        client = bearer_client(self.staff, ['statistics:read'])
        self._assert(client.get(URL, RANGE), 200)
        self.staff.is_staff = False
        self.staff.save()
        memory_cache.clear()
        self._assert(client.get(URL, RANGE), 403, 'not_allowed')
        assert ApiToken.objects.get(owner=self.staff).scopes == ['statistics:read']

    def test_token_with_game_restriction_reads_export(self):
        """Test that per-game restrictions on the token do not affect the export."""
        client = bearer_client(self.staff, ['statistics:read'], games=[GameFactory()])
        self._assert(client.get(URL, RANGE), 200)

    def test_token_with_scope_rejects_writes(self):
        """Test that the export route refuses non-GET methods to a scoped token."""
        client = bearer_client(self.staff, ['statistics:read'])
        self._assert(client.post(URL, {}), 403, 'token_not_allowed')


@pytest.mark.django_db
class TestStaffStatisticsExportInvalidToken:
    """Unusable scoped tokens give 401 token_invalid on the export, sibling and clear routes."""

    PATHS = (('get', URL), ('get', SIBLING_URL), ('delete', CLEAR_URL))

    def setup_method(self):
        """Set up a staff owner."""
        memory_cache.clear()
        self.staff = UserFactory(is_staff=True)

    def _assert_invalid(self, client):
        """Assert every route answers 401 token_invalid."""
        for method, path in self.PATHS:
            response = getattr(client, method)(path)
            assert response.status_code == 401
            assert response.data['detail'].code == 'token_invalid'

    def test_revoked_token(self):
        """Test that a revoked (deleted) token is invalid."""
        client = bearer_client(self.staff, ['statistics:read'])
        ApiToken.objects.filter(owner=self.staff).delete()
        self._assert_invalid(client)

    def test_expired_token(self):
        """Test that an expired token is invalid."""
        client = bearer_client(self.staff, ['statistics:read'])
        ApiToken.objects.filter(owner=self.staff).update(
            expires_at=timezone.now() - timedelta(days=1),
        )
        self._assert_invalid(client)

    def test_non_approved_owner(self):
        """Test that a token whose owner is no longer approved is invalid."""
        client = bearer_client(self.staff, ['statistics:read'])
        UserProfileFactory(user=self.staff, status=UserProfile.STATUS_PENDING)
        self._assert_invalid(client)
