"""Custom DRF authentication classes for Majora."""

import hmac
import re

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from accounts.models import ApiToken, UserProfile
from accounts.models.api_token import hash_secret

BEARER_PATTERN = re.compile(r'(^|,)\s*bearer(\s|$)', re.IGNORECASE)
API_TOKEN_PATTERN = re.compile(r'^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$')
BEARER_REALM = 'Bearer realm="api"'
INVALID_TOKEN_HEADER = f'{BEARER_REALM}, error="invalid_token"'


def is_approved(user):
    """Return whether `user`'s profile status is `approved`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.status == UserProfile.STATUS_APPROVED


class InvalidApiToken(AuthenticationFailed):
    """Generic 401 raised for every Bearer request that does not authenticate."""

    default_code = 'token_invalid'


class ApiTokenNotAllowed(PermissionDenied):
    """403 raised when an authenticated API token may not perform the request."""

    default_code = 'token_not_allowed'


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
        match = self._match_token(header.split())
        if match is None:
            raise InvalidApiToken()
        return match.groups()

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
        """Refuse the request unless `api_token` may perform it.

        Interim fail-closed until #1603 adds the per-view scope check: every authenticated
        token is refused with 403 `token_not_allowed`. #1603 replaces this body.
        """
        raise ApiTokenNotAllowed()


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
