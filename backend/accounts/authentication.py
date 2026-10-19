"""Custom DRF authentication classes for Majora."""

import hmac
import re

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from accounts.models import ApiToken, UserProfile
from accounts.models.api_token import hash_secret
from accounts.scopes import effective_scopes
from games.decorators import get_token_scopes

# Bearer detection must stay identical to the proxy's BearerSkipCacheMiddleware PCRE
# `/(^|,)\s*bearer(\s|$)/i` (no `/u`): ASCII-only, so `\s` never matches Unicode whitespace
# such as `\xa0`. Otherwise Django could authenticate a header the proxy would still cache.
BEARER_PATTERN = re.compile(r'(^|,)\s*bearer(\s|$)', re.ASCII | re.IGNORECASE)
# Token header parts are separated by ASCII spaces and tabs only (see `BEARER_PATTERN`).
HEADER_SEPARATOR = re.compile(r'[ \t]+')
API_TOKEN_PATTERN = re.compile(r'^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$')
BEARER_REALM = 'Bearer realm="api"'
INVALID_TOKEN_HEADER = f'{BEARER_REALM}, error="invalid_token"'

# Route prefixes a scoped token may never reach, whatever it declares: token management
# and account data (`account/`), `users/`, `staff/` and Django `admin/`.
EXCLUDED_ROUTE_PREFIXES = ('account/', 'users/', 'staff/', 'admin/')


def is_excluded_route(route):
    """Return whether the URL `route` belongs to a family scoped tokens may never reach."""
    return (route or '').lstrip('^').startswith(EXCLUDED_ROUTE_PREFIXES)


def is_approved(user):
    """Return whether `user`'s profile status is `approved`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.status == UserProfile.STATUS_APPROVED


class InvalidApiToken(AuthenticationFailed):
    """Generic 401 raised for every Bearer request that does not authenticate."""

    default_code = 'token_invalid'


class ApiTokenForbidden(PermissionDenied):
    """Base 403 for scoped-token refusals, rendered as `{"errors": {"detail": [code]}}`."""

    default_code = 'token_not_allowed'


class ApiTokenNotAllowed(ApiTokenForbidden):
    """403 raised when the endpoint is excluded or declares no scopes for the method."""

    default_code = 'token_not_allowed'


class ScopeMissing(ApiTokenForbidden):
    """403 raised when the token lacks a scope the endpoint requires."""

    default_code = 'scope_missing'


class GameNotAllowed(ApiTokenForbidden):
    """403 raised when the request's `game_slug` is not on the token's game list."""

    default_code = 'game_not_allowed'


class TokenScopeCheck:
    """Decide whether a scoped API token may perform the resolved request.

    Excluded routes (`EXCLUDED_ROUTE_PREFIXES`) and unresolved requests always fail with
    `token_not_allowed`, even if a view there declares scopes. Otherwise the declaration
    comes from `@token_scopes` on `request.resolver_match.func`. `HEAD`
    follows the `GET` entry; every other method, `OPTIONS` included, needs its own entry
    or the request fails closed with `token_not_allowed`. The game comes only from the
    `game_slug` URL kwarg: no object lookups are done.
    """

    def __init__(self, request, api_token):
        """Keep the request, its resolver match and the authenticated token."""
        self.request = request
        self.api_token = api_token
        self.match = getattr(request, 'resolver_match', None)

    def run(self):
        """Raise the matching `ApiTokenForbidden` subclass unless the token may proceed."""
        if not self._required_scopes() <= effective_scopes(self.api_token):
            raise ScopeMissing()
        if not self._game_allowed():
            raise GameNotAllowed()

    def _required_scopes(self):
        """Return the scopes the view declares for the method, or raise `token_not_allowed`."""
        if self.match is None or is_excluded_route(self.match.route):
            raise ApiTokenNotAllowed()
        declaration = get_token_scopes(self.match.func)
        method = self._declared_method()
        if declaration is None or method not in declaration:
            raise ApiTokenNotAllowed()
        return frozenset(declaration[method])

    def _declared_method(self):
        """Return the method whose declaration applies (`HEAD` follows `GET`)."""
        method = self.request.method
        return 'GET' if method == 'HEAD' else method

    def _game_allowed(self):
        """Return whether the URL's `game_slug`, if any, is allowed by the token's games."""
        slug = self.match.kwargs.get('game_slug')
        if slug is None:
            return True
        slugs = set(self.api_token.games.values_list('game_slug', flat=True))
        return not slugs or slug in slugs


class ApiTokenAuthentication(BaseAuthentication):
    """Authenticate scoped API tokens sent as `Authorization: Bearer mjr_<prefix>_<secret>`.

    Requests without a Bearer header are left to the next class (`None`). Every Bearer
    request that does not authenticate raises the same `InvalidApiToken` (401) and never
    falls back to the session or to anonymous.
    """

    def authenticate(self, request):
        """Return `(owner, api_token)` for a valid Bearer token, or None when not Bearer."""
        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not BEARER_PATTERN.search(header):
            return None

        request.api_token_invalid = True
        api_token = self._authenticate_token(header)
        request.api_token_invalid = False
        self._touch(api_token)
        self._check_scopes(request, api_token)
        return (api_token.owner, api_token)

    def authenticate_header(self, request):
        """Return the `WWW-Authenticate` value, flagging invalid Bearer tokens (RFC 6750)."""
        if getattr(request, 'api_token_invalid', False):
            return INVALID_TOKEN_HEADER
        return BEARER_REALM

    def _authenticate_token(self, header):
        """Return the valid, usable `ApiToken` named by `header`, or raise `InvalidApiToken`."""
        prefix, secret = self._parse(header)
        api_token = self._find(prefix)
        if not self._is_usable(api_token, secret):
            raise InvalidApiToken()
        return api_token

    def _parse(self, header):
        """Return `(prefix, secret)` from a well-formed Bearer header, or raise."""
        match = self._match_token(self._split(header))
        if match is None:
            raise InvalidApiToken()
        return match.groups()

    def _split(self, header):
        """Return `header`'s parts split on ASCII spaces and tabs only, never Unicode spaces."""
        return HEADER_SEPARATOR.split(header.strip(' \t'))

    def _match_token(self, parts):
        """Return the token pattern match for `[scheme, token]` parts, or None."""
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        return API_TOKEN_PATTERN.match(parts[1])

    def _find(self, prefix):
        """Return the `ApiToken` with `prefix`, or raise when none exists."""
        api_token = ApiToken.objects.select_related('owner').filter(prefix=prefix).first()
        if api_token is None:
            raise InvalidApiToken()
        return api_token

    def _is_usable(self, api_token, secret):
        """Return whether the secret matches and the token and its owner are still valid."""
        return (
            hmac.compare_digest(api_token.hashed_secret, hash_secret(secret))
            and not api_token.is_expired()
            and api_token.owner.is_active
            and is_approved(api_token.owner)
        )

    def _touch(self, api_token):
        """Record that `api_token` just authenticated, without overwriting other fields."""
        now = timezone.now()
        ApiToken.objects.filter(pk=api_token.pk).update(last_used_at=now)
        api_token.last_used_at = now

    def _check_scopes(self, request, api_token):
        """Refuse the request (403) unless `api_token` carries the scopes and game it needs."""
        TokenScopeCheck(request, api_token).run()


class CookieTokenAuthentication(TokenAuthentication):
    """Authenticate via Authorization: Token header, falling back to session.

    First attempts standard token-header authentication. If no Authorization
    header is present, or if the header token is stale/deleted (which would
    normally raise AuthenticationFailed), reads ``auth_token`` from the Django
    session (written there by the login/register views) and authenticates via
    that token.

    A resolved user whose profile status isn't `approved` is treated as
    unauthenticated (returns `None`), so `pending`/`denied` users look logged
    out to every view built on top of this authentication class.
    """

    def authenticate(self, request):
        """Return (user, token) if authenticated and approved, else None."""
        result = self.authenticate_via_header(request) or self._authenticate_via_session(request)

        if result is None or not is_approved(result[0]):
            return None

        return result

    def authenticate_via_header(self, request):
        """Return (user, token) via the Authorization header, or None.

        Unlike `authenticate`, this does not filter out unapproved users — it is also used
        directly by the login-status endpoint, which needs to distinguish a `pending`/`denied`
        user's valid token from no token at all.
        """
        try:
            return super().authenticate(request)
        except AuthenticationFailed:
            return None  # stale header token — fall through to session

    def _authenticate_via_session(self, request):
        """Return (user, token) via the session-stored token, or None."""
        token_key = request.session.get('auth_token')
        if not token_key:
            return None

        try:
            token_obj = Token.objects.select_related('user').get(key=token_key)
        except Token.DoesNotExist:
            return None

        return (token_obj.user, token_obj)
