"""Scoped API token issued by an approved device-authorization request.

See `docs/agents/access-control/api-token.md` (scoped device authorization).
"""

from datetime import timedelta

from django.utils import timezone

from accounts.models import ApiToken
from accounts.serializers.api_token.create import NAME_MAX_LENGTH

SCOPED_TOKEN_LIFETIME = timedelta(hours=24)
NAME_PREFIX = 'Device authorization'


class DeviceAuthorizationToken:
    """Issue the `mjr_` token for a scoped, approved `AuthorizationRequest`.

    The token carries exactly the request's scopes, no per-game restriction and a fixed
    24-hour expiry. Only its hash is stored; the plain value is returned once by `issue()`.
    """

    def __init__(self, authorization_request):
        """Keep the approved request the token is issued for."""
        self.authorization_request = authorization_request

    def issue(self):
        """Create the token for the request's user and return its plain value."""
        now = timezone.now()
        _, plain_token = ApiToken.objects.create_token(
            owner=self.authorization_request.user,
            name=self.name(now),
            scopes=list(self.authorization_request.scopes),
            expires_at=now + SCOPED_TOKEN_LIFETIME,
        )
        return plain_token

    def name(self, now):
        """Return `Device authorization <date> — <browser>`, cut to the token name limit."""
        parts = [f'{NAME_PREFIX} {timezone.localdate(now).isoformat()}']
        if self.authorization_request.browser:
            parts.append(self.authorization_request.browser)
        return ' — '.join(parts)[:NAME_MAX_LENGTH]
