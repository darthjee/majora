"""Custom DRF authentication classes for Majora."""

from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed


class CookieTokenAuthentication(TokenAuthentication):
    """Authenticate via Authorization: Token header, falling back to session.

    First attempts standard token-header authentication. If no Authorization
    header is present, or if the header token is stale/deleted (which would
    normally raise AuthenticationFailed), reads ``auth_token`` from the Django
    session (written there by the login/register views) and authenticates via
    that token.
    """

    def authenticate(self, request):
        """Return (user, token) if authenticated, else None."""
        try:
            result = super().authenticate(request)
        except AuthenticationFailed:
            result = None  # stale header token — fall through to session

        if result is not None:
            return result

        token_key = request.session.get('auth_token')
        if not token_key:
            return None

        try:
            token_obj = Token.objects.select_related('user').get(key=token_key)
        except Token.DoesNotExist:
            return None

        return (token_obj.user, token_obj)
