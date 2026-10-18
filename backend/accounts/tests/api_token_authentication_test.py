"""Tests for the ApiTokenAuthentication class."""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.urls import ResolverMatch
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory

from accounts.authentication import ApiTokenAuthentication
from accounts.models import ApiToken, UserProfile
from games.decorators import token_scopes
from games.tests.factories import GameFactory, UserFactory

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

    def test_unresolved_request_is_refused(self):
        """Test that a request with no resolved view fails closed with `token_not_allowed`."""
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
        """Test that a valid Bearer token decides over the session (undeclared view: 403)."""
        response = self.client.get(ACCOUNT_URL, HTTP_AUTHORIZATION=f'Bearer {self.plain}')
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': ['token_not_allowed']}}

    def test_invalid_token_body_unchanged(self):
        """Test that the 401 `token_invalid` body keeps DRF's default shape."""
        header = f'Bearer {self._wrong_secret_token()}'
        response = self.client.get(ACCOUNT_URL, HTTP_AUTHORIZATION=header)
        assert set(response.data) == {'detail'}

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


class DenyAll(BasePermission):
    """Test permission standing in for an owner role that does not allow the request."""

    def has_permission(self, request, view):
        """Always refuse."""
        return False


@token_scopes(GET=[], POST=['npcs:write', 'documents:read'])
@api_view(['GET', 'POST', 'PUT'])
@permission_classes([AllowAny])
def scoped_view(request, game_slug=None):
    """Test view: public read, write needing two families, undeclared PUT."""
    return Response({'user': request.user.username})


@api_view(['GET'])
@permission_classes([AllowAny])
def undeclared_view(request):
    """Test view without a `@token_scopes` declaration."""
    return Response({})


@token_scopes(POST=['npcs:write'])
@api_view(['POST'])
@permission_classes([DenyAll])
def role_denied_view(request, game_slug=None):
    """Test view whose own permission check refuses everyone."""
    return Response({})


@pytest.mark.django_db
class TestApiTokenScopeCheck(ApiTokenTestMixin):
    """Tests for the per-view scope and game check, through test-only views."""

    def setup_method(self):
        """Set up two games and a token holding the scopes of `scoped_view`'s POST."""
        super().setup_method()
        self.game = GameFactory(game_slug='allowed-game')
        self.other_game = GameFactory(game_slug='other-game')
        self._set_scopes(['npcs:write', 'documents:read'])

    def _set_scopes(self, scopes):
        """Store `scopes` on the token."""
        ApiToken.objects.filter(pk=self.api_token.pk).update(scopes=scopes)

    def _call(self, view, method='get', **kwargs):
        """Call `view` with the Bearer token and a resolver match carrying `kwargs`."""
        request = getattr(self.factory, method)('/', HTTP_AUTHORIZATION=f'Bearer {self.plain}')
        request.resolver_match = ResolverMatch(view, (), kwargs)
        return view(request, **kwargs)

    def _assert_refused(self, response, code):
        """Assert a 403 with the project error body for `code`."""
        assert response.status_code == 403
        assert response.data == {'errors': {'detail': [code]}}

    def test_public_read_needs_no_scope(self):
        """Test that a declared public read is allowed for a token without scopes."""
        self._set_scopes([])
        response = self._call(scoped_view)
        assert response.status_code == 200
        assert response.data == {'user': 'alice'}

    def test_head_follows_get(self):
        """Test that HEAD uses the GET declaration."""
        self._set_scopes([])
        request = self.factory.head('/', HTTP_AUTHORIZATION=f'Bearer {self.plain}')
        request.resolver_match = ResolverMatch(scoped_view, (), {})
        user, _ = self.auth.authenticate(request)
        assert user == self.user

    def test_all_scopes_present_is_allowed(self):
        """Test that a write is allowed when every required scope is present."""
        assert self._call(scoped_view, 'post').status_code == 200

    def test_missing_scope(self):
        """Test that lacking one required scope gives `scope_missing`."""
        self._set_scopes(['npcs:write'])
        self._assert_refused(self._call(scoped_view, 'post'), 'scope_missing')

    def test_unknown_stored_scope_grants_nothing(self):
        """Test that a stored scope outside the catalogue does not count."""
        self._set_scopes(['npcs:write', 'documents:read:legacy'])
        self._assert_refused(self._call(scoped_view, 'post'), 'scope_missing')

    def test_undeclared_view(self):
        """Test that a view without a declaration gives `token_not_allowed`."""
        self._assert_refused(self._call(undeclared_view), 'token_not_allowed')

    def test_undeclared_method(self):
        """Test that a method without an entry gives `token_not_allowed`."""
        self._assert_refused(self._call(scoped_view, 'put'), 'token_not_allowed')

    def test_options_fails_closed(self):
        """Test that OPTIONS without its own entry gives `token_not_allowed`."""
        self._assert_refused(self._call(scoped_view, 'options'), 'token_not_allowed')

    def test_game_not_on_list(self):
        """Test that a slug outside the token's games gives `game_not_allowed`."""
        self.api_token.games.set([self.game])
        response = self._call(scoped_view, 'post', game_slug='other-game')
        self._assert_refused(response, 'game_not_allowed')

    def test_game_on_list(self):
        """Test that a slug on the token's games is allowed."""
        self.api_token.games.set([self.game])
        response = self._call(scoped_view, 'post', game_slug='allowed-game')
        assert response.status_code == 200

    def test_empty_game_list_allows_any_game(self):
        """Test that a token without games may reach any game."""
        response = self._call(scoped_view, 'post', game_slug='other-game')
        assert response.status_code == 200

    def test_view_without_game_slug_uses_scopes_only(self):
        """Test that a request without `game_slug` ignores the token's games."""
        self.api_token.games.set([self.game])
        assert self._call(scoped_view, 'post').status_code == 200

    def test_scope_checked_before_game(self):
        """Test that a missing scope is reported even when the game is also wrong."""
        self.api_token.games.set([self.game])
        self._set_scopes([])
        response = self._call(scoped_view, 'post', game_slug='other-game')
        self._assert_refused(response, 'scope_missing')

    def test_owner_role_still_applies(self):
        """Test that holding the scope does not bypass the view's own permission check."""
        self._set_scopes(['npcs:write'])
        response = self._call(role_denied_view, 'post', game_slug='allowed-game')
        assert response.status_code == 403
        assert response.data['detail'].code == 'permission_denied'

    def test_session_request_ignores_declaration(self):
        """Test that a session request to an undeclared view is unaffected."""
        request = self.factory.get('/')
        request.session = {'auth_token': Token.objects.create(user=self.user).key}
        request.resolver_match = ResolverMatch(undeclared_view, (), {})
        response = undeclared_view(request)
        assert response.status_code == 200

    def test_legacy_token_ignores_declaration(self):
        """Test that a legacy `Token` request to an undeclared view is unaffected."""
        token = Token.objects.create(user=self.user)
        request = self.factory.get('/', HTTP_AUTHORIZATION=f'Token {token.key}')
        request.resolver_match = ResolverMatch(undeclared_view, (), {})
        assert undeclared_view(request).status_code == 200
