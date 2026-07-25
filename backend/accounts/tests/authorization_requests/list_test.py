"""Tests for the authorization-request list endpoint."""

import json
from datetime import timedelta

import pytest
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from accounts.models import AuthorizationRequest
from games.tests.behaviors import TokenAuthRequestMixin
from games.tests.factories import UserFactory

LIST_URL = '/account/authorization_requests.json'
TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestAuthorizationRequestListView(TokenAuthRequestMixin):
    """Tests for GET /account/authorization_requests.json."""

    def setup_method(self):
        """Set up an authenticated user and another user."""
        self.user = UserFactory(username='alice', password=TEST_PASSWORD)
        self.token = Token.objects.create(user=self.user)
        self.other_user = UserFactory(username='bob', password=TEST_PASSWORD)

    def test_returns_401_when_unauthenticated(self, client):
        """Test that an unauthenticated request is rejected."""
        response = self.get(client, LIST_URL)
        assert response.status_code == 401

    def test_returns_only_the_caller_s_own_requests(self, client):
        """Test that only the authenticated user's own requests are listed."""
        AuthorizationRequest.create_with_token(user=self.user, ip='1.2.3.4', browser='mine')
        AuthorizationRequest.create_with_token(user=self.other_user, ip='5.6.7.8', browser='theirs')

        response = self.get(client, LIST_URL, token=self.token)
        assert response.status_code == 200
        data = json.loads(response.content)
        assert len(data) == 1
        assert data[0]['browser'] == 'mine'

    def test_orders_newest_first(self, client):
        """Test that requests are listed newest-first."""
        first, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='first',
        )
        second, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='second',
        )

        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert [row['uuid'] for row in data] == [str(second.uuid), str(first.uuid)]

    def test_row_shape_excludes_id_token_and_user(self, client):
        """Test that each listed row exposes only uuid/created_at/status/ip/browser."""
        AuthorizationRequest.create_with_token(user=self.user, ip='1.2.3.4', browser='mine')

        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert set(data[0].keys()) == {'uuid', 'created_at', 'status', 'ip', 'browser'}

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        response = self.get(client, LIST_URL, token=self.token)
        assert response['X-Skip-Cache'] == 'true'

    def test_reports_lazily_expired_open_row_as_expired(self, client):
        """Test that a lazily-expired open row is reported and persisted as expired."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='mine',
        )
        authorization_request.expires_at = timezone.now() - timedelta(seconds=1)
        authorization_request.save(update_fields=['expires_at'])

        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['status'] == AuthorizationRequest.STATUS_EXPIRED

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_EXPIRED

    def test_reports_lazily_expired_approved_row_as_expired(self, client):
        """Test that a lazily-expired approved row is reported and persisted as expired."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='mine',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.expires_at = timezone.now() - timedelta(seconds=1)
        authorization_request.save(update_fields=['status', 'expires_at'])

        response = self.get(client, LIST_URL, token=self.token)
        data = json.loads(response.content)
        assert data[0]['status'] == AuthorizationRequest.STATUS_EXPIRED

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_EXPIRED
