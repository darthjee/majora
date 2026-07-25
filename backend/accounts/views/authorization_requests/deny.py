"""View for denying a pending authorization request."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import AuthorizationRequest

from ._shared import NOT_OPEN_ERROR, expire_if_lazily_expired, lookup_owned_or_error, skip_cache


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def deny(request, uuid):
    """Deny an open authorization request owned by the caller."""
    authorization_request, error_response = lookup_owned_or_error(request, uuid)
    if error_response:
        return error_response

    # Lazy expiration is evaluated (and persisted) before the not-open check below, so a
    # request that expired since it was last read is reported as `not_open` accurately.
    expire_if_lazily_expired(authorization_request)

    if authorization_request.status != AuthorizationRequest.STATUS_OPEN:
        return skip_cache(Response(NOT_OPEN_ERROR, status=422))

    authorization_request.status = AuthorizationRequest.STATUS_DENIED
    authorization_request.save(update_fields=['status', 'updated_at'])
    return skip_cache(Response(status=202))
