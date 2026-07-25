"""Custom DRF authentication classes for Majora."""

from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed

from accounts.models import UserProfile


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
        result = self._authenticate_via_header(request) or self._authenticate_via_session(request)

        if result is None or not self._is_approved(result[0]):
            return None

        return result

    def _authenticate_via_header(self, request):
        """Return (user, token) via the Authorization header, or None."""
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

    def _is_approved(self, user):
        """Return whether `user`'s profile status is `approved`."""
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile.status == UserProfile.STATUS_APPROVED
