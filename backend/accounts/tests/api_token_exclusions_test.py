"""Tests that excluded families always refuse scoped API tokens."""

import pytest
from django.urls import ResolverMatch
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory

from accounts.authentication import ApiTokenAuthentication, is_excluded_route
from accounts.models import ApiToken
from accounts.scopes import SCOPES
from games.decorators import token_scopes
from games.tests.factories import UserFactory

REFUSED_BODY = {'errors': {'detail': ['token_not_allowed']}}


@token_scopes(GET=[])
@api_view(['GET'])
@permission_classes([AllowAny])
def declared_view(request):
    """Test view declaring a public read, mounted on an excluded route in the tests."""
    return Response({})


@pytest.mark.django_db
class TestApiTokenExclusions:
    """Excluded routes give 403 `token_not_allowed` to a token holding every scope."""

    def setup_method(self):
        """Set up a staff owner with a fully-scoped token."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.user.is_staff = True
        self.user.is_superuser = True
        self.user.save()
        _, plain = ApiToken.objects.create_token(self.user, 'automation', list(SCOPES))
        self.header = f'Bearer {plain}'
        self.client = APIClient()

    def _header(self, scopes):
        """Return a Bearer header for a new token of the staff owner with `scopes`."""
        _, plain = ApiToken.objects.create_token(self.user, 'scoped', scopes)
        return f'Bearer {plain}'

    def _assert_refused(self, response):
        """Assert a 403 `token_not_allowed` with the project error body."""
        assert response.status_code == 403
        assert response.data == REFUSED_BODY

    def test_account(self):
        """Test that `account/*` refuses scoped tokens."""
        self._assert_refused(
            self.client.get('/account/account.json', HTTP_AUTHORIZATION=self.header)
        )

    def test_users(self):
        """Test that `users/*` refuses scoped tokens."""
        self._assert_refused(
            self.client.delete('/users/logout.json', HTTP_AUTHORIZATION=self.header)
        )

    def test_staff(self):
        """Test that `staff/*` refuses scoped tokens."""
        self._assert_refused(self.client.get('/staff/users.json', HTTP_AUTHORIZATION=self.header))

    @pytest.mark.parametrize('path', [
        '/staff/statistics/domains.json',
        '/staff/statistics/visits.json',
        '/staff/statistics/overview.json',
        '/staff/statistics/summary.json',
        '/staff/statistics/visitors.json',
        '/staff/statistics/duration.json',
        '/staff/statistics/domains/summary.json',
        '/staff/statistics/users.json',
        '/staff/statistics/visit-list.json',
        '/staff/cache/summary.json',
        '/staff/crawler/summary.json',
        '/staff/photos.json',
        '/staff/copies.json',
    ])
    def test_other_staff_reads_refuse_statistics_scope(self, path):
        """Test that staff reads other than the export refuse a statistics:read token."""
        header = self._header(['statistics:read'])
        self._assert_refused(self.client.get(path, HTTP_AUTHORIZATION=header))

    @pytest.mark.parametrize('path', [
        '/staff/statistics/visits.json',
        '/staff/cache/summary.json',
        '/staff/photos.json',
    ])
    def test_other_staff_reads_refuse_without_statistics_scope(self, path):
        """Test that staff reads refuse a token without statistics:read."""
        header = self._header(['npcs:read'])
        self._assert_refused(self.client.get(path, HTTP_AUTHORIZATION=header))

    def test_statistics_clear_refuses_scoped_token(self):
        """Test that the statistics clear refuses a token holding every scope."""
        self._assert_refused(
            self.client.delete('/staff/statistics.json', HTTP_AUTHORIZATION=self.header)
        )

    def test_statistics_clear_refuses_statistics_scope(self):
        """Test that the statistics clear refuses a statistics:read token."""
        header = self._header(['statistics:read'])
        self._assert_refused(
            self.client.delete('/staff/statistics.json', HTTP_AUTHORIZATION=header)
        )

    @pytest.mark.parametrize('method, path', [
        ('delete', '/staff/cache.json'),
        ('post', '/staff/crawler.json'),
    ])
    def test_staff_writes_refuse_scoped_token(self, method, path):
        """Test that staff cache and crawler writes refuse a token holding every scope."""
        response = getattr(self.client, method)(path, HTTP_AUTHORIZATION=self.header)
        self._assert_refused(response)

    def test_token_management_even_if_declared(self):
        """Test that a declared view under `account/api_tokens` still refuses scoped tokens."""
        request = APIRequestFactory().get('/', HTTP_AUTHORIZATION=self.header)
        request.resolver_match = ResolverMatch(
            declared_view, (), {}, route='account/api_tokens.json'
        )
        with pytest.raises(PermissionDenied) as error:
            ApiTokenAuthentication().authenticate(request)
        assert error.value.get_codes() == 'token_not_allowed'

    def test_admin_ignores_scoped_tokens(self):
        """Test that Django admin never authenticates a Bearer token (login redirect)."""
        response = self.client.get('/admin/', HTTP_AUTHORIZATION=self.header)
        assert response.status_code == 302
        assert '/admin/login/' in response['Location']


class TestIsExcludedRoute:
    """Tests for `is_excluded_route`."""

    @pytest.mark.parametrize(
        'route',
        ['account/account.json', 'users/login.json', 'staff/cache.json', 'admin/', '^admin/'],
    )
    def test_excluded(self, route):
        """Test that excluded family prefixes are matched."""
        assert is_excluded_route(route)

    @pytest.mark.parametrize(
        'route', ['games/<slug:game_slug>.json', 'miniatures/sources.json', 'accounts.json', None]
    )
    def test_not_excluded(self, route):
        """Test that other routes are not excluded."""
        assert not is_excluded_route(route)

    @pytest.mark.parametrize(
        'route', ['staff/statistics/export.json', '^staff/statistics/export.json'],
    )
    def test_export_route_is_carved_out(self, route):
        """Test that the exact export route is not excluded."""
        assert not is_excluded_route(route)

    @pytest.mark.parametrize('route', [
        'staff/statistics/export.json/',
        'staff/statistics/export.jsonx',
        'staff/statistics/export',
        'staff/statistics/export.json/<int:id>.json',
        'staff/statistics/visits.json',
        'staff/statistics.json',
        'staff/statistics/',
        'account/statistics/export.json',
        'staff/statistics/export.csv',
    ])
    def test_carve_out_is_exact(self, route):
        """Test that only the exact export route escapes the exclusion, never a prefix."""
        assert is_excluded_route(route)
