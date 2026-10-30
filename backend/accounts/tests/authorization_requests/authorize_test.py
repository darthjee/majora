"""Tests for the authorization-request authorize endpoint."""

import uuid
from datetime import timedelta

import pytest
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from accounts.models import AuthorizationRequest
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory

TEST_PASSWORD = get_random_string(20)


def _authorize_url(authorization_request):
    """Return the authorize URL for the given authorization request."""
    return f'/account/authorization_requests/{authorization_request.uuid}/authorize.json'


@pytest.mark.django_db
class TestAuthorizationRequestAuthorizeView(TokenAuthRequestMixin):
    """Tests for PATCH /account/authorization_requests/<uuid>/authorize.json."""

    def setup_method(self):
        """Set up an authenticated user, another user, and their token."""
        self.user = UserFactory(username='alice', password=TEST_PASSWORD)
        self.token = Token.objects.create(user=self.user)
        self.other_user = UserFactory(username='bob', password=TEST_PASSWORD)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated PATCH is rejected."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
        )
        assert response.status_code == 401

    def test_returns_403_when_uuid_is_unknown(self, client):
        """Test that an unknown uuid returns 403 not_found."""
        response = self.patch(
            client,
            f'/account/authorization_requests/{uuid.uuid4()}/authorize.json',
            {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response.status_code == 403
        assert response.json() == {'error': 'not_found'}

    def test_returns_403_when_request_belongs_to_another_user(self, client):
        """Test that another user's request returns 403 not_found."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.other_user, ip='1.2.3.4', browser='test-agent',
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response.status_code == 403
        assert response.json() == {'error': 'not_found'}

    def test_returns_401_when_password_does_not_match(self, client):
        """Test that an incorrect password returns 401 invalid_credentials."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': 'wrong-password'},
            token=self.token,
        )
        assert response.status_code == 401
        assert response.json() == {'error': 'invalid_credentials'}

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_OPEN

    def test_returns_422_not_open_when_already_denied(self, client):
        """Test that a non-open request returns 422 not_open even with a correct password."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_DENIED
        authorization_request.save(update_fields=['status'])

        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response.status_code == 422
        assert response.json() == {'error': 'not_open'}

    def test_returns_422_expired_when_lazily_expired(self, client):
        """Test that a freshly lazily-expired request returns 422 expired and is persisted."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.expires_at = timezone.now() - timedelta(seconds=1)
        authorization_request.save(update_fields=['expires_at'])

        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response.status_code == 422
        assert response.json() == {'error': 'expired'}

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_EXPIRED

    def test_returns_422_not_open_when_already_persisted_as_expired(self, client):
        """Test that an already-expired (persisted) request returns not_open, not expired."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_EXPIRED
        authorization_request.expires_at = timezone.now() - timedelta(seconds=1)
        authorization_request.save(update_fields=['status', 'expires_at'])

        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response.status_code == 422
        assert response.json() == {'error': 'not_open'}

    def test_returns_202_and_approves_an_open_request(self, client):
        """Test that an open request owned by the caller is approved, returning 202."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response.status_code == 202

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_APPROVED

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=self.token,
        )
        assert response['X-Skip-Cache'] == 'true'


@pytest.mark.django_db
class TestAuthorizationRequestAuthorizeScopes(TokenAuthRequestMixin):
    """Tests for the staff-only scope check of the authorize endpoint."""

    def setup_method(self):
        """Set up a staff user and a non-staff user, each with a token."""
        self.staff = UserFactory(username='staff', password=TEST_PASSWORD, is_staff=True)
        self.staff_token = Token.objects.create(user=self.staff)
        self.player = UserFactory(username='player', password=TEST_PASSWORD)
        self.player_token = Token.objects.create(user=self.player)

    def _authorize(self, client, user, token, scopes):
        """Create a request for `user` asking for `scopes`, approve it; return both."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=user, ip='1.2.3.4', browser='test-agent', scopes=scopes,
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': TEST_PASSWORD},
            token=token,
        )
        authorization_request.refresh_from_db()
        return response, authorization_request

    def test_staff_approves_a_statistics_read_request(self, client):
        """Test that a staff user approves a statistics:read request."""
        response, authorization_request = self._authorize(
            client, self.staff, self.staff_token, ['statistics:read'],
        )
        assert response.status_code == 202
        assert authorization_request.status == AuthorizationRequest.STATUS_APPROVED

    def test_non_staff_gets_scope_staff_only(self, client):
        """Test that a non-staff user approving statistics:read gets 400 scope_staff_only."""
        response, _ = self._authorize(
            client, self.player, self.player_token, ['statistics:read'],
        )
        assert response.status_code == 400
        assert response.json() == {'errors': {'scopes': ['scope_staff_only']}}

    def test_non_staff_rejection_keeps_the_request_open(self, client):
        """Test that a rejected staff-only approval leaves the request open."""
        _, authorization_request = self._authorize(
            client, self.player, self.player_token, ['games:read', 'statistics:read'],
        )
        assert authorization_request.status == AuthorizationRequest.STATUS_OPEN

    def test_non_staff_rejection_returns_skip_cache_header(self, client):
        """Test that the scope_staff_only response includes the X-Skip-Cache header."""
        response, _ = self._authorize(
            client, self.player, self.player_token, ['statistics:read'],
        )
        assert response['X-Skip-Cache'] == 'true'

    def test_non_staff_approves_non_staff_scopes(self, client):
        """Test that a non-staff user approves a request with only non-staff scopes."""
        response, authorization_request = self._authorize(
            client, self.player, self.player_token, ['games:read'],
        )
        assert response.status_code == 202
        assert authorization_request.status == AuthorizationRequest.STATUS_APPROVED

    def test_wrong_password_is_checked_before_scopes(self, client):
        """Test that a wrong password still returns 401 for a staff-only request."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.player, ip='1.2.3.4', browser='test-agent', scopes=['statistics:read'],
        )
        response = self.patch(
            client, _authorize_url(authorization_request), {'password': 'wrong-password'},
            token=self.player_token,
        )
        assert response.status_code == 401
