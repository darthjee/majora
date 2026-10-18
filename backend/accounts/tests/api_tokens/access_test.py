"""Session-only access tests for the owner-side scoped API token endpoints."""

import pytest
from rest_framework.test import APIClient

from accounts.models import UserProfile
from accounts.tests.api_tokens.support import (
    REFUSED_BODY,
    bearer_client,
    create_token,
    legacy_token_client,
    session_client,
)
from games.tests.factories import UserFactory, UserProfileFactory

LIST_URL = '/account/api_tokens.json'
OPTIONS_URL = '/account/api_tokens/options.json'
CREATE_BODY = {'name': 'Bot', 'scopes': ['npcs:read']}
SUCCESS_STATUS = {'list': 200, 'options': 200, 'create': 201, 'rename': 200, 'revoke': 204}
ACTIONS = list(SUCCESS_STATUS)


@pytest.mark.django_db
class TestApiTokenOwnerAccess:
    """Every owner endpoint is session-only."""

    def setup_method(self):
        """Set up an approved owner and one token to rename and revoke."""
        self.user = UserFactory()
        self.api_token = create_token(self.user)

    def _call(self, client, action):
        """Call the endpoint for `action` with `client`."""
        detail_url = f'/account/api_tokens/{self.api_token.pk}.json'
        calls = {
            'list': lambda: client.get(LIST_URL),
            'options': lambda: client.get(OPTIONS_URL),
            'create': lambda: client.post(LIST_URL, CREATE_BODY, format='json'),
            'rename': lambda: client.patch(detail_url, {'name': 'New'}, format='json'),
            'revoke': lambda: client.delete(detail_url),
        }
        return calls[action]()

    @pytest.mark.parametrize('action', ACTIONS)
    def test_scoped_token_refused(self, action):
        """Test that a scoped token with every scope gets 403 token_not_allowed."""
        response = self._call(bearer_client(self.user), action)
        assert response.status_code == 403
        assert response.json() == REFUSED_BODY
        assert response['X-Skip-Cache'] == 'true'

    @pytest.mark.parametrize('action', ACTIONS)
    def test_bearer_plus_session_refused(self, action):
        """Test that a Bearer token sent along a session is refused."""
        client = bearer_client(self.user, client=session_client(self.user))
        response = self._call(client, action)
        assert response.status_code == 403
        assert response.json() == REFUSED_BODY

    @pytest.mark.parametrize('action', ACTIONS)
    def test_anonymous_gets_401(self, action):
        """Test that an anonymous caller gets 401."""
        response = self._call(APIClient(), action)
        assert response.status_code == 401
        assert response['X-Skip-Cache'] == 'true'

    @pytest.mark.parametrize('status', [UserProfile.STATUS_PENDING, UserProfile.STATUS_DENIED])
    @pytest.mark.parametrize('action', ACTIONS)
    def test_unapproved_user_gets_401(self, action, status):
        """Test that pending and denied users get 401."""
        UserProfileFactory(user=self.user, status=status)
        response = self._call(session_client(self.user), action)
        assert response.status_code == 401

    @pytest.mark.parametrize('action', ACTIONS)
    def test_session_cookie_succeeds(self, action):
        """Test that a cookie session succeeds."""
        response = self._call(session_client(self.user), action)
        assert response.status_code == SUCCESS_STATUS[action]
        assert response['X-Skip-Cache'] == 'true'

    @pytest.mark.parametrize('action', ACTIONS)
    def test_legacy_token_succeeds(self, action):
        """Test that a legacy DRF Token header succeeds."""
        response = self._call(legacy_token_client(self.user), action)
        assert response.status_code == SUCCESS_STATUS[action]
