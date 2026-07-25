"""Tests for the authorization-request polling endpoint."""

import json
import threading
import uuid
from datetime import timedelta

import pytest
from django.test import Client
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework.authtoken.models import Token

from accounts.models import AuthorizationRequest, UserProfile
from games.tests.factories import UserFactory, UserProfileFactory

TEST_PASSWORD = get_random_string(20)


def _poll_url(authorization_request):
    """Return the polling URL for the given authorization request."""
    return f'/users/authorization_requests/{authorization_request.uuid}.json'


def _poll(client, authorization_request, token):
    """Issue a GET poll request, carrying the given token header."""
    return client.get(_poll_url(authorization_request), HTTP_X_AUTHORIZE_TOKEN=token)


@pytest.mark.django_db
class TestAuthorizationRequestPollView:
    """Tests for GET /users/authorization_requests/<uuid>.json."""

    def setup_method(self):
        """Set up a requesting user."""
        self.user = UserFactory(username='alice', password=TEST_PASSWORD)

    def test_returns_403_for_unknown_uuid(self, client):
        """Test that an unknown uuid returns 403 not_found."""
        response = client.get(
            f'/users/authorization_requests/{uuid.uuid4()}.json', HTTP_X_AUTHORIZE_TOKEN='x',
        )
        assert response.status_code == 403
        assert json.loads(response.content) == {'error': 'not_found'}

    def test_returns_403_for_mismatched_token(self, client):
        """Test that a wrong token returns 403 not_found."""
        authorization_request, _ = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        response = _poll(client, authorization_request, 'wrong-token')
        assert response.status_code == 403
        assert json.loads(response.content) == {'error': 'not_found'}

    def test_returns_403_for_already_logged_status(self, client):
        """Test that an already-consumed (logged) request returns 403 not_found."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_LOGGED
        authorization_request.save(update_fields=['status'])
        response = _poll(client, authorization_request, raw_token)
        assert response.status_code == 403
        assert json.loads(response.content) == {'error': 'not_found'}

    def test_returns_403_for_denied_status(self, client):
        """Test that a denied request returns 403 not_found."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_DENIED
        authorization_request.save(update_fields=['status'])
        response = _poll(client, authorization_request, raw_token)
        assert response.status_code == 403
        assert json.loads(response.content) == {'error': 'not_found'}

    def test_returns_200_open_status(self, client):
        """Test that a still-open request returns 200 with status open."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        response = _poll(client, authorization_request, raw_token)
        assert response.status_code == 200
        assert json.loads(response.content) == {'status': 'open'}

    def test_returns_422_and_persists_expired_when_lazily_expired_while_open(self, client):
        """Test that a lazily-expired open request returns 422 and is persisted as expired."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.expires_at = timezone.now() - timedelta(seconds=1)
        authorization_request.save(update_fields=['expires_at'])

        response = _poll(client, authorization_request, raw_token)
        assert response.status_code == 422
        assert json.loads(response.content) == {'status': 'expired'}

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_EXPIRED

    def test_returns_422_and_persists_expired_when_lazily_expired_while_approved(self, client):
        """Test that a lazily-expired approved request also returns 422 expired."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.expires_at = timezone.now() - timedelta(seconds=1)
        authorization_request.save(update_fields=['status', 'expires_at'])

        response = _poll(client, authorization_request, raw_token)
        assert response.status_code == 422
        assert json.loads(response.content) == {'status': 'expired'}

    def test_returns_403_for_denied_user_even_when_approved(self, client):
        """Test that an approved request for a denied user gets 403 not_found, no token."""
        UserProfileFactory(user=self.user, status=UserProfile.STATUS_DENIED)
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])

        response = _poll(client, authorization_request, raw_token)

        assert response.status_code == 403
        assert json.loads(response.content) == {'error': 'not_found'}
        assert not Token.objects.filter(user=self.user).exists()

    def test_returns_202_with_login_token_when_approved(self, client):
        """Test that an approved request returns 202 with a real login token."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])

        response = _poll(client, authorization_request, raw_token)
        assert response.status_code == 202
        data = json.loads(response.content)
        assert data['status'] == 'approved'
        assert Token.objects.filter(key=data['token'], user=self.user).exists()

    def test_transitions_to_logged_when_approved_poll_succeeds(self, client):
        """Test that a successful approved poll persists the logged status."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])

        _poll(client, authorization_request, raw_token)

        authorization_request.refresh_from_db()
        assert authorization_request.status == AuthorizationRequest.STATUS_LOGGED

    def test_stores_login_token_in_session(self, client):
        """Test that the issued login token is stored in the session, like a normal login."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])

        response = _poll(client, authorization_request, raw_token)
        data = json.loads(response.content)
        assert client.session['auth_token'] == data['token']

    def test_second_poll_after_a_successful_transition_gets_403_logged(self, client):
        """Test that re-polling an already-consumed request gets 403 not_found."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])

        first_response = _poll(client, authorization_request, raw_token)
        second_response = _poll(client, authorization_request, raw_token)

        assert first_response.status_code == 202
        assert second_response.status_code == 403
        assert json.loads(second_response.content) == {'error': 'not_found'}

    @pytest.mark.django_db(transaction=True)
    def test_only_one_of_two_concurrent_polls_wins_the_approved_to_logged_race(self):
        """Test that of two near-simultaneous polls on an approved request, only one wins."""
        user = UserFactory(username='concurrent-alice', password=TEST_PASSWORD)
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=user, ip='1.2.3.4', browser='test-agent',
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])

        results = []
        barrier = threading.Barrier(2)

        def _poll_concurrently():
            """Wait for both threads to be ready, then issue the poll request."""
            barrier.wait()
            response = _poll(Client(), authorization_request, raw_token)
            results.append(response.status_code)

        threads = [threading.Thread(target=_poll_concurrently) for _ in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        assert sorted(results) == [202, 403]
