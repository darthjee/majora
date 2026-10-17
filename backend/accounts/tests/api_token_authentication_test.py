"""Tests for the ApiTokenAuthentication class."""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory

from accounts.authentication import ApiTokenAuthentication
from accounts.models import ApiToken, UserProfile
from games.tests.factories import UserFactory

ACCOUNT_URL = '/account/account.json'
INVALID_HEADER = 'Bearer realm="api", error="invalid_token"'


class ApiTokenTestMixin:
    """Shared fixtures for ApiTokenAuthentication tests."""

    def setup_method(self):
        """Set up an approved user owning one valid API token."""
        self.user = UserFactory(username='alice', password='secret-password')
        self.api_token, self.plain = ApiToken.objects.create_token(
            self.user, 'automation', ['games:read']
        )
        self.auth = ApiTokenAuthentication()
        self.factory = APIRequestFactory()

    def _request(self, header=None):
        """Return a request carrying `header` as its Authorization value, if given."""
        extra = {} if header is None else {'HTTP_AUTHORIZATION': header}
        return self.factory.get('/', **extra)

    def _wrong_secret_token(self):
        """Return the valid token with a different, well-formed secret."""
        last = 'B' if self.plain[-1] == 'A' else 'A'
        return self.plain[:-1] + last

    def _assert_invalid(self, header):
        """Assert that `header` raises the generic 401 and does not touch `last_used_at`."""
        request = self._request(header)
        with pytest.raises(AuthenticationFailed) as error:
            self.auth.authenticate(request)
        assert error.value.get_codes() == 'token_invalid'
        assert self.auth.authenticate_header(request) == INVALID_HEADER
        self.api_token.refresh_from_db()
        assert self.api_token.last_used_at is None


@pytest.mark.django_db
class TestApiTokenAuthenticationNotBearer(ApiTokenTestMixin):
    """Tests for requests the Bearer class leaves to the next class."""

    def test_no_header_returns_none(self):
        """Test that a request without Authorization returns None."""
        assert self.auth.authenticate(self._request()) is None

    def test_legacy_token_header_returns_none(self):
        """Test that a legacy `Token <key>` header returns None."""
        token = Token.objects.create(user=self.user)
        assert self.auth.authenticate(self._request(f'Token {token.key}')) is None

    def test_default_authenticate_header(self):
        """Test that non-Bearer 401s carry the plain Bearer realm."""
        assert self.auth.authenticate_header(self._request()) == 'Bearer realm="api"'


@pytest.mark.django_db
class TestApiTokenAuthenticationDetection(ApiTokenTestMixin):
    """Tests that Bearer variants are all treated as Majora tokens."""

    @pytest.mark.parametrize('scheme', ['Bearer ', 'bearer ', 'BEARER ', 'Bearer\t', '  Bearer '])
    def test_bearer_variants_are_detected(self, scheme):
        """Test that each Bearer variant reaches the token checks."""
        with pytest.raises(PermissionDenied):
            self.auth.authenticate(self._request(f'{scheme}{self.plain}'))


@pytest.mark.django_db
class TestApiTokenAuthenticationFailures(ApiTokenTestMixin):
    """Tests that every failing Bearer request gives the generic 401."""

    def test_single_part(self):
        """Test that a bare `Bearer` scheme is invalid."""
        self._assert_invalid('Bearer')

    def test_three_parts(self):
        """Test that a value with three parts is invalid."""
        self._assert_invalid(f'Bearer {self.plain} extra')

    def test_joined_multi_header(self):
        """Test that a joined `Token x, Bearer mjr_...` value is invalid."""
        self._assert_invalid(f'Token abc, Bearer {self.plain}')

    def test_bad_pattern(self):
        """Test that a token not matching the format is invalid."""
        self._assert_invalid(f'Bearer {self.plain}x')

    def test_unknown_prefix(self):
        """Test that a well-formed token with an unknown prefix is invalid."""
        self._assert_invalid('Bearer mjr_Zz9Zz9Zz_' + 'a' * 43)

    def test_revoked_token(self):
        """Test that a deleted token is invalid."""
        ApiToken.objects.filter(pk=self.api_token.pk).delete()
        request = self._request(f'Bearer {self.plain}')
        with pytest.raises(AuthenticationFailed) as error:
            self.auth.authenticate(request)
        assert error.value.get_codes() == 'token_invalid'

    def test_wrong_secret(self):
        """Test that a known prefix with the wrong secret is invalid."""
        self._assert_invalid(f'Bearer {self._wrong_secret_token()}')

    def test_expired(self):
        """Test that an expired token is invalid."""
        ApiToken.objects.filter(pk=self.api_token.pk).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        self._assert_invalid(f'Bearer {self.plain}')

    def test_inactive_owner(self):
        """Test that a token whose owner is inactive is invalid."""
        self.user.is_active = False
        self.user.save()
        self._assert_invalid(f'Bearer {self.plain}')

    def test_pending_owner(self):
        """Test that a token whose owner is pending is invalid."""
        UserProfile.objects.filter(user=self.user).update(status=UserProfile.STATUS_PENDING)
        self._assert_invalid(f'Bearer {self.plain}')

    def test_denied_owner(self):
        """Test that a token whose owner is denied is invalid."""
        UserProfile.objects.filter(user=self.user).update(status=UserProfile.STATUS_DENIED)
        self._assert_invalid(f'Bearer {self.plain}')


@pytest.mark.django_db
class TestApiTokenAuthenticationSuccess(ApiTokenTestMixin):
    """Tests for a Bearer token that authenticates."""

    def test_valid_token_is_refused_interim(self):
        """Test that a valid token gets 403 `token_not_allowed` until scopes are checked."""
        with pytest.raises(PermissionDenied) as error:
            self.auth.authenticate(self._request(f'Bearer {self.plain}'))
        assert error.value.get_codes() == 'token_not_allowed'

    def test_valid_token_updates_last_used_at(self):
        """Test that a valid token records `last_used_at` even when refused."""
        with pytest.raises(PermissionDenied):
            self.auth.authenticate(self._request(f'Bearer {self.plain}'))
        self.api_token.refresh_from_db()
        assert self.api_token.last_used_at is not None

    def test_last_used_at_does_not_overwrite_other_fields(self):
        """Test that the last-used write keeps a concurrent rename."""
        ApiToken.objects.filter(pk=self.api_token.pk).update(name='renamed')
        with pytest.raises(PermissionDenied):
            self.auth.authenticate(self._request(f'Bearer {self.plain}'))
        self.api_token.refresh_from_db()
        assert self.api_token.name == 'renamed'

    def test_valid_token_returns_owner_and_token(self):
        """Test that, past the scope check, the owner and token are returned."""
        with patch.object(ApiTokenAuthentication, '_check_scopes'):
            user, api_token = self.auth.authenticate(self._request(f'Bearer {self.plain}'))
        assert user == self.user
        assert api_token == self.api_token

    def test_request_auth_is_the_api_token(self):
        """Test that a view sees the owner as `request.user` and the token as `request.auth`."""
        seen = {}

        @api_view(['GET'])
        def view(request):
            seen.update(user=request.user, auth=request.auth)
            return Response({})

        with patch.object(ApiTokenAuthentication, '_check_scopes'):
            response = view(self._request(f'Bearer {self.plain}'))
        assert response.status_code == 200
        assert seen == {'user': self.user, 'auth': self.api_token}


@pytest.mark.django_db
class TestApiTokenAuthenticationEndToEnd(ApiTokenTestMixin):
    """End-to-end tests through a real view with a Bearer header and a session."""

    def setup_method(self):
        """Set up a client logged in through the session as another user."""
        super().setup_method()
        session_user = UserFactory(username='bob', password='secret-password')
        self.client = APIClient()
        session = self.client.session
        session['auth_token'] = Token.objects.create(user=session_user).key
        session.save()

    def test_session_alone_authenticates(self):
        """Test that the session still authenticates without a Bearer header."""
        response = self.client.get(ACCOUNT_URL)
        assert response.status_code == 200

    def test_bad_token_is_not_rescued_by_session(self):
        """Test that a bad Bearer token gives 401 even with a valid session."""
        header = f'Bearer {self._wrong_secret_token()}'
        response = self.client.get(ACCOUNT_URL, HTTP_AUTHORIZATION=header)
        assert response.status_code == 401
        assert response.data['detail'].code == 'token_invalid'
        assert response['WWW-Authenticate'] == INVALID_HEADER

    def test_valid_token_is_not_the_session_user(self):
        """Test that a valid Bearer token decides over the session (interim 403)."""
        response = self.client.get(ACCOUNT_URL, HTTP_AUTHORIZATION=f'Bearer {self.plain}')
        assert response.status_code == 403
        assert response.data['detail'].code == 'token_not_allowed'

    def test_legacy_token_still_authenticates(self):
        """Test that a legacy `Token <key>` header still authenticates."""
        token = Token.objects.create(user=self.user)
        response = APIClient().get(ACCOUNT_URL, HTTP_AUTHORIZATION=f'Token {token.key}')
        assert response.status_code == 200

    def test_anonymous_401_carries_bearer_realm(self):
        """Test that a non-Bearer 401 carries the plain Bearer realm."""
        response = APIClient().get(ACCOUNT_URL)
        assert response.status_code == 401
        assert response['WWW-Authenticate'] == 'Bearer realm="api"'
