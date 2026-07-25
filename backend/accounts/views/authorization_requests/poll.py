"""View for polling an authorization request's status from the requesting device."""

from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from accounts.models import AuthorizationRequest, UserProfile
from accounts.views.auth._shared import attach_statistics_session

from ._shared import (
    NOT_FOUND_ERROR,
    expire_if_lazily_expired,
    get_authorization_request,
    skip_cache,
)

_TERMINAL_CONSUMED_STATUSES = (
    AuthorizationRequest.STATUS_LOGGED, AuthorizationRequest.STATUS_DENIED,
)


class AuthorizationRequestPollThrottle(AnonRateThrottle):
    """Per-IP rate limit guarding this pre-login, frequently-polled endpoint."""

    scope = 'authorization_request_poll'


@api_view(['GET'])
# AllowAny: intentionally pre-login -- the requesting device isn't authenticated yet.
@permission_classes([AllowAny])
@throttle_classes([AuthorizationRequestPollThrottle])
def poll(request, uuid):
    """Report an authorization request's status, issuing login credentials once approved."""
    authorization_request = get_authorization_request(uuid)
    if authorization_request is None or not _token_matches(request, authorization_request):
        return skip_cache(Response(NOT_FOUND_ERROR, status=403))

    if authorization_request.status in _TERMINAL_CONSUMED_STATUSES:
        return skip_cache(Response(NOT_FOUND_ERROR, status=403))

    expire_if_lazily_expired(authorization_request)

    if authorization_request.status == AuthorizationRequest.STATUS_EXPIRED:
        return skip_cache(Response({'status': 'expired'}, status=422))

    if authorization_request.status == AuthorizationRequest.STATUS_OPEN:
        return skip_cache(Response({'status': 'open'}))

    return _resolve_approved(request, authorization_request)


def _token_matches(request, authorization_request):
    """Return whether the request's `X-Authorize-Token` header matches, constant-time."""
    raw_token = request.headers.get('X-Authorize-Token', '')
    return authorization_request.matches_token(raw_token)


def _resolve_approved(request, authorization_request):
    """Attempt the atomic approved->logged transition, issuing credentials only if won.

    A losing concurrent poller (the row was already flipped to `logged` by another
    request) gets the same `403 not_found` response as any other already-consumed request.
    A `denied` user's request also gets that same response, instead of a token, keeping
    the enumeration-safety invariant already established by `authorization_requests/create`.
    """
    if _user_is_denied(authorization_request.user):
        return skip_cache(Response(NOT_FOUND_ERROR, status=403))

    if not authorization_request.try_transition_approved_to_logged():
        return skip_cache(Response(NOT_FOUND_ERROR, status=403))

    token_key = _issue_login_credentials(request, authorization_request.user)
    return skip_cache(Response({'status': 'approved', 'token': token_key}, status=202))


def _user_is_denied(user):
    """Return whether `user`'s profile status is `denied`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.status == UserProfile.STATUS_DENIED


def _issue_login_credentials(request, user):
    """Issue a real login token for `user`, mirroring `accounts.views.auth.login`."""
    token, _ = Token.objects.get_or_create(user=user)
    request.session['auth_token'] = token.key
    attach_statistics_session(request, user)
    return token.key
