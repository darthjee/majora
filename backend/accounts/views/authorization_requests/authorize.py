"""View for approving a pending authorization request, re-verifying the caller's password."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import AuthorizationRequest

from ._shared import (
    EXPIRED_ERROR,
    INVALID_CREDENTIALS_ERROR,
    NOT_OPEN_ERROR,
    expire_if_lazily_expired,
    lookup_owned_or_error,
    skip_cache,
)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def authorize(request, uuid):
    """Approve an open authorization request owned by the caller.

    Requires the caller's current password again (re-authentication), since this grants a
    new login elsewhere -- mirrors `accounts.views.auth.login`'s "Invalid credentials"
    convention for the password mismatch case.
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

    authorization_request.status = AuthorizationRequest.STATUS_APPROVED
    authorization_request.save(update_fields=['status', 'updated_at'])
    return skip_cache(Response(status=202))
