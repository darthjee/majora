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
from rest_framework.test import APIClient

from accounts.models import ApiToken, AuthorizationRequest, UserProfile
from accounts.serializers.api_token.create import NAME_MAX_LENGTH
from games.tests.factories import UserFactory, UserProfileFactory
from majora_project.cache import memory_cache
from statistics import cookies
from statistics.models import Session

TEST_PASSWORD = get_random_string(20)
POLL_ROUTE = 'users/authorization_requests/<uuid:uuid>.json'
EXPORT_URL = '/staff/statistics/export.json'
EXPORT_RANGE = {'from': '2026-01-01', 'to': '2026-01-03'}
CLEAR_URL = '/staff/statistics.json'


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


@pytest.mark.django_db
class TestAuthorizationRequestPollStatisticsSession:
    """Tests for the statistics session tracking columns written by an approved poll."""

    def setup_method(self):
        """Set up a requesting user with an approved authorization request."""
        self.user = UserFactory(username='alice', password=TEST_PASSWORD)
        self.authorization_request, self.raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser='test-agent',
        )
        self.authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        self.authorization_request.save(update_fields=['status'])

    def test_poll_without_cookie_marks_the_new_session_logged(self, client):
        """Test that a poll attaching in place to the session it created records `true`."""
        response = _poll(client, self.authorization_request, self.raw_token)

        session = self._session_from(response)
        assert session.user_id == self.user.id
        assert session.first_seen_logged is True
        assert session.first_path == POLL_ROUTE

    def test_poll_rotation_records_login_rotation_without_uuid(self, client):
        """Test that a poll rotation records `login_rotation` and a route without the `uuid`."""
        existing_session = Session.objects.create(ip='127.0.0.1', user=self.user)
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(existing_session.token)

        response = _poll(client, self.authorization_request, self.raw_token)

        rotated = self._session_from(response)
        assert rotated.pk != existing_session.pk
        assert rotated.creation_reason == 'login_rotation'
        assert rotated.first_seen_logged is True
        assert rotated.first_path == POLL_ROUTE
        assert str(self.authorization_request.uuid) not in rotated.first_path

    def _session_from(self, response):
        """Return the statistics `Session` carried by `response`'s cookie."""
        signed_value = response.cookies[cookies.COOKIE_NAME].value
        return Session.objects.get(token=cookies.unsign(signed_value))


@pytest.mark.django_db
class TestAuthorizationRequestPollScopedToken:
    """Tests for the scoped `mjr_` token issued by polling an approved scoped request."""

    def setup_method(self):
        """Set up a staff user with an approved statistics:read request."""
        memory_cache.clear()
        self.user = UserFactory(username='alice', password=TEST_PASSWORD, is_staff=True)
        self.authorization_request, self.raw_token = self._approved_request('test-agent')

    def _approved_request(self, browser, scopes=('statistics:read', 'games:read')):
        """Create an approved request for the user asking for `scopes`."""
        authorization_request, raw_token = AuthorizationRequest.create_with_token(
            user=self.user, ip='1.2.3.4', browser=browser, scopes=list(scopes),
        )
        authorization_request.status = AuthorizationRequest.STATUS_APPROVED
        authorization_request.save(update_fields=['status'])
        return authorization_request, raw_token

    def _poll_token(self, client, authorization_request=None, raw_token=None):
        """Poll the (default) scoped request and return the issued plain token."""
        response = _poll(
            client,
            authorization_request or self.authorization_request,
            raw_token or self.raw_token,
        )
        return json.loads(response.content)['token']

    def _api_token(self, plain_token):
        """Return the stored `ApiToken` matching `plain_token`'s prefix."""
        prefix = plain_token.split('_')[1]
        return ApiToken.objects.get(prefix=prefix)

    def test_returns_202_with_an_mjr_token(self, client):
        """Test that the poll keeps the 202 approved shape, carrying an mjr_ token."""
        response = _poll(client, self.authorization_request, self.raw_token)
        assert response.status_code == 202
        data = json.loads(response.content)
        assert set(data.keys()) == {'status', 'token'}
        assert data['status'] == 'approved'
        assert data['token'].startswith('mjr_')

    def test_token_is_owned_by_the_request_user(self, client):
        """Test that the issued token belongs to the request's user."""
        api_token = self._api_token(self._poll_token(client))
        assert api_token.owner_id == self.user.id

    def test_token_carries_exactly_the_requested_scopes(self, client):
        """Test that the issued token holds exactly the request's scopes."""
        api_token = self._api_token(self._poll_token(client))
        assert api_token.scopes == ['statistics:read', 'games:read']

    def test_token_expires_in_24_hours(self, client):
        """Test that the issued token expires 24 hours after being issued."""
        before = timezone.now()
        api_token = self._api_token(self._poll_token(client))
        after = timezone.now()
        assert before + timedelta(hours=24) <= api_token.expires_at
        assert api_token.expires_at <= after + timedelta(hours=24)

    def test_token_has_no_game_restriction(self, client):
        """Test that the issued token is not restricted to any game."""
        api_token = self._api_token(self._poll_token(client))
        assert api_token.games.count() == 0

    def test_token_name_carries_the_date_and_browser(self, client):
        """Test that the token is named after the issuing date and the request's browser."""
        api_token = self._api_token(self._poll_token(client))
        today = timezone.localdate().isoformat()
        assert api_token.name == f'Device authorization {today} — test-agent'

    def test_token_name_without_browser_is_just_the_date(self, client):
        """Test that a blank browser leaves only the date part in the name."""
        authorization_request, raw_token = self._approved_request('')
        api_token = self._api_token(self._poll_token(client, authorization_request, raw_token))
        assert api_token.name == f'Device authorization {timezone.localdate().isoformat()}'

    def test_token_name_is_truncated(self, client):
        """Test that a long browser is cut so the name fits the token name limit."""
        authorization_request, raw_token = self._approved_request('x' * 255)
        api_token = self._api_token(self._poll_token(client, authorization_request, raw_token))
        assert len(api_token.name) == NAME_MAX_LENGTH

    def test_stores_only_the_token_hash(self, client):
        """Test that the plain token is never stored."""
        plain_token = self._poll_token(client)
        api_token = self._api_token(plain_token)
        assert plain_token.split('_')[2] != api_token.hashed_secret

    def test_creates_no_legacy_token(self, client):
        """Test that a scoped poll never creates a DRF Token."""
        self._poll_token(client)
        assert not Token.objects.filter(user=self.user).exists()

    def test_sets_no_session_auth_token(self, client):
        """Test that a scoped poll never logs the browser session in."""
        self._poll_token(client)
        assert 'auth_token' not in client.session

    def test_attaches_no_statistics_session(self, client):
        """Test that a scoped poll never ties a statistics session to the user."""
        self._poll_token(client)
        assert not Session.objects.filter(user=self.user).exists()

    def test_leaves_an_existing_statistics_session_untouched(self, client):
        """Test that a scoped poll neither rotates nor attaches an existing statistics session."""
        existing_session = Session.objects.create(ip='127.0.0.1')
        client.cookies[cookies.COOKIE_NAME] = cookies.sign(existing_session.token)
        self._poll_token(client)
        existing_session.refresh_from_db()
        assert existing_session.user_id is None
        assert Session.objects.filter(user=self.user).count() == 0

    def test_transitions_to_logged(self, client):
        """Test that a scoped poll consumes the request."""
        self._poll_token(client)
        self.authorization_request.refresh_from_db()
        assert self.authorization_request.status == AuthorizationRequest.STATUS_LOGGED

    def test_second_poll_gets_403(self, client):
        """Test that re-polling a consumed scoped request gets 403 not_found."""
        self._poll_token(client)
        response = _poll(client, self.authorization_request, self.raw_token)
        assert response.status_code == 403
        assert json.loads(response.content) == {'error': 'not_found'}

    def test_token_reads_the_statistics_export(self, client):
        """Test that the issued token authenticates as a Bearer token on the export."""
        api_client = APIClient()
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._poll_token(client)}')
        response = api_client.get(EXPORT_URL, EXPORT_RANGE)
        assert response.status_code == 200

    def test_token_cannot_clear_statistics(self, client):
        """Test that the read-only token is refused on the statistics clear."""
        api_client = APIClient()
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._poll_token(client)}')
        response = api_client.delete(CLEAR_URL)
        assert response.status_code == 403
