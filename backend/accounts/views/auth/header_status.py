"""View for the Header-specific login-status endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ._shared import resolve_status_payload, skip_cache

HEADER_STATUS_FIELDS = (
    'logged_in', 'status', 'is_superuser', 'is_staff', 'cache_token', 'token', 'settings',
)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def header_status(request):
    """Report the narrow login-status subset `Header` needs.

    Reuses `status.py`'s resolution logic (`resolve_status_payload`) rather than
    re-deriving `UserProfile.status` gating or re-implementing `CacheToken` minting, and
    only exposes the fields `Header` actually consumes. `Header` re-hydrates `AuthStorage`'s
    token and applies the server-side `favorite_language` preference on every bootstrap
    (e.g. after a page refresh), so `token` (present only for `session_auth`, matching
    `resolve_status_payload`'s own conditional) and `settings` pass through unchanged;
    `username` and `user_id` remain omitted since `Header` never needs them.
    """
    payload = resolve_status_payload(request)
    return skip_cache(Response(_narrow_payload(payload)))


def _narrow_payload(payload):
    """Return only the `Header`-relevant keys from the full status `payload`."""
    return {key: value for key, value in payload.items() if key in HEADER_STATUS_FIELDS}
