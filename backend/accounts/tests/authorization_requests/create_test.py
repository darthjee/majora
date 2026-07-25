"""Tests for the authorization-request creation endpoint."""

import json

import pytest
from django.utils.crypto import get_random_string

from accounts.models import AuthorizationRequest
from games.tests.factories import UserFactory

CREATE_URL = '/users/authorization_requests.json'
TEST_PASSWORD = get_random_string(20)


@pytest.mark.django_db
class TestAuthorizationRequestCreateView:
    """Tests for POST /users/authorization_requests.json."""

    def _post(self, client, username):
        """Issue a create request for the given username."""
        return client.post(
            CREATE_URL,
            data=json.dumps({'username': username}),
            content_type='application/json',
        )

    def test_returns_201_for_known_username(self, client):
        """Test that a request for a real user returns 201."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = self._post(client, 'alice')
        assert response.status_code == 201

    def test_response_shape_for_known_username(self, client):
        """Test that the success payload exposes exactly uuid/expiration/token."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = self._post(client, 'alice')
        data = json.loads(response.content)
        assert set(data.keys()) == {'uuid', 'expiration', 'token'}

    def test_creates_request_linked_to_the_matching_user(self, client):
        """Test that a matching username links the created request to that user."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        response = self._post(client, 'alice')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.user_id == user.id

    def test_unknown_username_returns_identical_status_and_shape(self, client):
        """Test enumeration-safety: an unknown username gets the exact same response."""
        known_response = self._post(client, 'unknown-user')
        assert known_response.status_code == 201
        data = json.loads(known_response.content)
        assert set(data.keys()) == {'uuid', 'expiration', 'token'}

    def test_unknown_username_still_creates_a_userless_request(self, client):
        """Test that an unknown username still creates a request, with no linked user."""
        response = self._post(client, 'unknown-user')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.user_id is None

    def test_unknown_username_request_stays_open(self, client):
        """Test that a userless request can never leave the open status."""
        response = self._post(client, 'unknown-user')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.status == AuthorizationRequest.STATUS_OPEN

    def test_stores_only_a_hash_of_the_returned_token(self, client):
        """Test that the raw token is never persisted, only its hash."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = self._post(client, 'alice')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.token_hash != data['token']
        assert authorization_request.matches_token(data['token'])

    def test_captures_the_requesting_ip(self, client):
        """Test that the request's REMOTE_ADDR is captured as the ip field."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = client.post(
            CREATE_URL,
            data=json.dumps({'username': 'alice'}),
            content_type='application/json',
            REMOTE_ADDR='9.8.7.6',
        )
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.ip == '9.8.7.6'

    def test_returns_skip_cache_header(self, client):
        """Test that the response includes the X-Skip-Cache: true header."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        response = self._post(client, 'alice')
        assert response['X-Skip-Cache'] == 'true'

    def test_truncates_an_oversized_user_agent(self, client):
        """Test that an oversized User-Agent is truncated to 255 chars, not rejected."""
        UserFactory(username='alice', password=TEST_PASSWORD)
        oversized_agent = 'x' * 500
        response = client.post(
            CREATE_URL,
            data=json.dumps({'username': 'alice'}),
            content_type='application/json',
            HTTP_USER_AGENT=oversized_agent,
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.browser == oversized_agent[:255]
