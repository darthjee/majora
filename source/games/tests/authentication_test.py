"""Tests for the CookieTokenAuthentication class."""

from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIRequestFactory

from games.authentication import CookieTokenAuthentication
from games.tests.factories import UserFactory


class TestCookieTokenAuthentication(TestCase):
    """Tests for CookieTokenAuthentication."""

    @classmethod
    def setUpTestData(cls):
        """Set up a user and token for tests."""
        cls.user = UserFactory(username='alice', password='secret')
        cls.token = Token.objects.create(user=cls.user)
        cls.auth = CookieTokenAuthentication()
        cls.factory = APIRequestFactory()

    def _request_with_header(self):
        """Return a DRF request authenticated via Authorization header."""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Token {self.token.key}'
        return request

    def _request_with_session(self, token_key=None):
        """Return a DRF request with an auth_token stored in the session."""
        request = self.factory.get('/')
        request.session = {'auth_token': token_key or self.token.key}
        return request

    def _request_anonymous(self):
        """Return a DRF request with no authentication."""
        request = self.factory.get('/')
        request.session = {}
        return request

    def test_authenticates_via_header(self):
        """Token header authentication returns the correct user."""
        request = self._request_with_header()
        result = self.auth.authenticate(request)
        assert result is not None
        user, token = result
        assert user == self.user
        assert token == self.token

    def test_authenticates_via_session(self):
        """Session-based fallback returns the correct user when no header is present."""
        request = self._request_with_session()
        result = self.auth.authenticate(request)
        assert result is not None
        user, token = result
        assert user == self.user
        assert token == self.token

    def test_returns_none_when_no_auth(self):
        """Anonymous request (no header, no session token) returns None."""
        request = self._request_anonymous()
        result = self.auth.authenticate(request)
        assert result is None

    def test_returns_none_for_missing_session_key(self):
        """Session with no auth_token entry returns None."""
        request = self.factory.get('/')
        request.session = {}
        result = self.auth.authenticate(request)
        assert result is None

    def test_returns_none_for_stale_session_token(self):
        """Session referencing a deleted token returns None."""
        self.token.delete()
        request = self._request_with_session()
        result = self.auth.authenticate(request)
        assert result is None

    def test_falls_through_to_session_when_header_token_is_stale(self):
        """Stale Authorization header falls through to a valid session token."""
        stale_key = self.token.key
        self.token.delete()
        # Create a fresh token for the same user
        new_token = Token.objects.create(user=self.user)
        # Request carries the stale key in the header but the new key in session
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Token {stale_key}'
        request.session = {'auth_token': new_token.key}
        result = self.auth.authenticate(request)
        assert result is not None
        user, token = result
        assert user == self.user
        assert token == new_token
