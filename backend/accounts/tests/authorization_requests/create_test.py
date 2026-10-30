"""Tests for the authorization-request creation endpoint."""

import json

import pytest
from django.core.cache import cache
from django.utils.crypto import get_random_string

from accounts.models import AuthorizationRequest
from accounts.scopes import SCOPES
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

    def test_returns_201_for_known_email(self, client):
        """Test that a request for a real user's email returns 201."""
        UserFactory(username='alice', password=TEST_PASSWORD, email='alice@example.com')
        response = self._post(client, 'alice@example.com')
        assert response.status_code == 201

    def test_creates_request_linked_to_the_matching_user_by_email(self, client):
        """Test that a matching email links the created request to that user."""
        user = UserFactory(username='alice', password=TEST_PASSWORD, email='alice@example.com')
        response = self._post(client, 'alice@example.com')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.user_id == user.id

    def test_matches_username_case_insensitively(self, client):
        """Test that an uppercased username still matches the lowercase-stored user."""
        user = UserFactory(username='alice', password=TEST_PASSWORD)
        response = self._post(client, 'ALICE')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.user_id == user.id

    def test_matches_email_case_insensitively(self, client):
        """Test that an uppercased email still matches the lowercase-stored user."""
        user = UserFactory(username='alice', password=TEST_PASSWORD, email='alice@example.com')
        response = self._post(client, 'ALICE@EXAMPLE.COM')
        data = json.loads(response.content)
        authorization_request = AuthorizationRequest.objects.get(uuid=data['uuid'])
        assert authorization_request.user_id == user.id

    def test_missing_username_returns_422(self, client):
        """Test that a missing username field is rejected with 422."""
        response = client.post(
            CREATE_URL,
            data=json.dumps({}),
            content_type='application/json',
        )
        assert response.status_code == 422
        assert json.loads(response.content) == {'error': 'missing_identifier'}

    def test_blank_username_returns_422(self, client):
        """Test that a blank username field is rejected with 422."""
        response = self._post(client, '')
        assert response.status_code == 422
        assert json.loads(response.content) == {'error': 'missing_identifier'}

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


@pytest.mark.django_db
class TestAuthorizationRequestCreateScopes:
    """Tests for the optional `scopes` field of POST /users/authorization_requests.json."""

    def setup_method(self):
        """Reset the per-IP create throttle and set up a user to request authorization for."""
        cache.clear()
        self.user = UserFactory(username='alice', password=TEST_PASSWORD)

    def _post(self, client, payload):
        """Issue a create request with the given JSON payload."""
        return client.post(CREATE_URL, data=json.dumps(payload), content_type='application/json')

    def _post_scopes(self, client, scopes):
        """Issue a create request for alice asking for `scopes`."""
        return self._post(client, {'username': 'alice', 'scopes': scopes})

    def _stored_scopes(self, response):
        """Return the scopes stored on the request created by `response`."""
        data = json.loads(response.content)
        return AuthorizationRequest.objects.get(uuid=data['uuid']).scopes

    def test_valid_scopes_return_201(self, client):
        """Test that a list of catalogue scopes is accepted."""
        response = self._post_scopes(client, ['statistics:read', 'games:read'])
        assert response.status_code == 201

    def test_valid_scopes_are_stored(self, client):
        """Test that the requested catalogue scopes are stored on the request."""
        response = self._post_scopes(client, ['statistics:read', 'games:read'])
        assert self._stored_scopes(response) == ['statistics:read', 'games:read']

    def test_valid_scopes_keep_the_response_shape(self, client):
        """Test that a scoped request returns the same uuid/expiration/token payload."""
        response = self._post_scopes(client, ['statistics:read'])
        assert set(json.loads(response.content).keys()) == {'uuid', 'expiration', 'token'}

    def test_valid_scopes_for_unknown_user_return_identical_shape(self, client):
        """Test enumeration-safety: valid scopes for an unknown user get the same response."""
        response = self._post(client, {'username': 'nobody', 'scopes': ['statistics:read']})
        assert response.status_code == 201
        assert set(json.loads(response.content).keys()) == {'uuid', 'expiration', 'token'}

    def test_missing_scopes_are_stored_as_empty_list(self, client):
        """Test that a request without `scopes` stores an empty list."""
        response = self._post(client, {'username': 'alice'})
        assert self._stored_scopes(response) == []

    def test_empty_scopes_are_stored_as_empty_list(self, client):
        """Test that an empty `scopes` list is a plain login request."""
        response = self._post_scopes(client, [])
        assert response.status_code == 201
        assert self._stored_scopes(response) == []

    def test_unknown_scope_returns_400(self, client):
        """Test that an unknown scope is rejected with invalid_scope."""
        response = self._post_scopes(client, ['statistics:write'])
        assert response.status_code == 400
        assert json.loads(response.content) == {'errors': {'scopes': ['invalid_scope']}}

    def test_duplicate_scope_returns_400(self, client):
        """Test that a duplicated scope is rejected with duplicate_scope."""
        response = self._post_scopes(client, ['games:read', 'games:read'])
        assert response.status_code == 400
        assert json.loads(response.content) == {'errors': {'scopes': ['duplicate_scope']}}

    def test_too_many_scopes_returns_400(self, client):
        """Test that more entries than the catalogue size are rejected."""
        response = self._post_scopes(client, list(SCOPES) + ['games:read'])
        assert response.status_code == 400
        assert json.loads(response.content) == {'errors': {'scopes': ['max_length']}}

    def test_non_list_scopes_returns_400(self, client):
        """Test that a non-list `scopes` value is rejected."""
        response = self._post_scopes(client, 'statistics:read')
        assert response.status_code == 400
        assert json.loads(response.content) == {'errors': {'scopes': ['not_a_list']}}

    def test_non_string_scope_entry_returns_400(self, client):
        """Test that a non-string entry is rejected."""
        response = self._post_scopes(client, [{'scope': 'games:read'}])
        assert response.status_code == 400
        assert 'scopes' in json.loads(response.content)['errors']

    def test_null_scopes_returns_400(self, client):
        """Test that a null `scopes` value is rejected."""
        response = self._post_scopes(client, None)
        assert response.status_code == 400
        assert json.loads(response.content) == {'errors': {'scopes': ['null']}}

    def test_invalid_scopes_create_no_request(self, client):
        """Test that an invalid scopes list creates no authorization request."""
        self._post_scopes(client, ['unknown:scope'])
        assert AuthorizationRequest.objects.count() == 0

    def test_invalid_scopes_for_unknown_user_return_identical_400(self, client):
        """Test enumeration-safety: invalid scopes get the same 400 for an unknown user."""
        response = self._post(client, {'username': 'nobody', 'scopes': ['unknown:scope']})
        assert response.status_code == 400
        assert json.loads(response.content) == {'errors': {'scopes': ['invalid_scope']}}

    def test_invalid_scopes_return_skip_cache_header(self, client):
        """Test that the 400 response includes the X-Skip-Cache: true header."""
        response = self._post_scopes(client, ['unknown:scope'])
        assert response['X-Skip-Cache'] == 'true'
