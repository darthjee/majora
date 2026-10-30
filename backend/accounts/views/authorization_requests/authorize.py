"""View for approving a pending authorization request, re-verifying the caller's password."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.api_tokens import may_hold_staff_scopes
from accounts.models import AuthorizationRequest
from accounts.scopes import STAFF_ONLY_SCOPES

from ._shared import (
    EXPIRED_ERROR,
    INVALID_CREDENTIALS_ERROR,
    NOT_OPEN_ERROR,
    expire_if_lazily_expired,
    lookup_owned_or_error,
    skip_cache,
)

SCOPE_STAFF_ONLY_ERROR = {'errors': {'scopes': ['scope_staff_only']}}


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def authorize(request, uuid):
    """Approve an open authorization request owned by the caller.

    Requires the caller's current password again (re-authentication), since this grants a
    new login elsewhere -- mirrors `accounts.views.auth.login`'s "Invalid credentials"
    convention for the password mismatch case. A request asking for a staff-only scope can
    only be approved by a staff user; anyone else gets `400 scope_staff_only` and the request
    stays `open`, so it can still be denied.
    """
    authorization_request, error_response = lookup_owned_or_error(request, uuid)
    if error_response:
        return error_response

    if expire_if_lazily_expired(authorization_request):
        return skip_cache(Response(EXPIRED_ERROR, status=422))

    if authorization_request.status != AuthorizationRequest.STATUS_OPEN:
        return skip_cache(Response(NOT_OPEN_ERROR, status=422))

    if not request.user.check_password(request.data.get('password', '')):
        return skip_cache(Response(INVALID_CREDENTIALS_ERROR, status=401))

    if _asks_forbidden_staff_scope(request.user, authorization_request):
        return skip_cache(Response(SCOPE_STAFF_ONLY_ERROR, status=400))

    authorization_request.status = AuthorizationRequest.STATUS_APPROVED
    authorization_request.save(update_fields=['status', 'updated_at'])
    return skip_cache(Response(status=202))


def _asks_forbidden_staff_scope(user, authorization_request):
    """Return whether the request asks for a staff-only scope `user` may not grant."""
    if STAFF_ONLY_SCOPES.isdisjoint(authorization_request.scopes):
        return False
    return not may_hold_staff_scopes(user)
