"""View for creating a passwordless "authorize with logged device" login request."""

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from accounts.models import AuthorizationRequest

from ._shared import MISSING_IDENTIFIER_ERROR, client_ip, skip_cache


class AuthorizationRequestCreateThrottle(AnonRateThrottle):
    """Per-IP rate limit guarding this pre-login, enumeration-prone creation endpoint."""

    scope = 'authorization_request_create'


@api_view(['POST'])
# AllowAny: intentionally pre-login -- the requesting device isn't authenticated yet.
@permission_classes([AllowAny])
@throttle_classes([AuthorizationRequestCreateThrottle])
def create(request):
    """Create an authorization request for the given `username` (a username or email).

    Enumeration-safe: the response has the exact same status/shape whether or not the
    identifier matches a real user. A request for an unknown identifier is still created
    (with `user=None`) so that timing/behavior is indistinguishable, but it can never leave
    `open` since there is no matching user to approve or deny it from. A missing/blank
    identifier is a client error, not an enumeration concern, so it is rejected with 422.
    """
    identifier = request.data.get('username', '')
    if not identifier:
        return skip_cache(Response(MISSING_IDENTIFIER_ERROR, status=422))

    user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
    # Truncated to fit AuthorizationRequest.browser's CharField(max_length=255): an oversized
    # User-Agent header must not be able to trigger a DB-level error here.
    browser = request.META.get('HTTP_USER_AGENT', '')[:255]

    authorization_request, raw_token = AuthorizationRequest.create_with_token(
        user=user, ip=client_ip(request), browser=browser,
    )

    payload = {
        'uuid': str(authorization_request.uuid),
        'expiration': authorization_request.expires_at,
        'token': raw_token,
    }
    return skip_cache(Response(payload, status=201))
