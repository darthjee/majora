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
