"""View for the login-status endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from accounts.models import CacheToken, UserProfile

from ._shared import _authenticate_from_session


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status(request):
    """Report whether the requesting token (if any) is logged in and approved."""
    result, session_auth = _resolve_authentication(request)

    if result is None:
        return _skip_cache(Response({'logged_in': False}))

    user, token_obj = result
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return _skip_cache(Response(_build_payload(user, profile, token_obj, session_auth)))


def _resolve_authentication(request):
    """Return a (result, session_auth) tuple, trying token then session authentication."""
    result = CookieTokenAuthentication().authenticate_via_header(request)

    if result is not None:
        return result, False

    return _authenticate_from_session(request)


def _build_payload(user, profile, token_obj, session_auth):
    """Build the status payload for `user`, honoring their profile's approval status.

    A `pending` user still resolves a valid token/session, but gets a dedicated
    `{'logged_in': False, 'status': 'pending'}` payload instead of the full logged-in one,
    so the frontend can show an "awaiting approval" screen. `denied` users fall back to a
    plain `{'logged_in': False}`.
    """
    if profile.status == UserProfile.STATUS_PENDING:
        return {'logged_in': False, 'status': 'pending'}

    if profile.status != UserProfile.STATUS_APPROVED:
        return {'logged_in': False}

    return _build_logged_in_payload(user, profile, token_obj, session_auth)


def _build_logged_in_payload(user, profile, token_obj, session_auth):
    """Build the full logged-in payload for an `approved` `user`.

    `cache_token` is (re)minted unconditionally, unlike `token` (which is only ever
    returned for `session_auth`), since a cache token needs to be established on every
    bootstrap call regardless of which authentication path resolved the user.
    """
    cache_token, _ = CacheToken.objects.get_or_create(user=user)
    payload = {
        'logged_in': True,
        'username': user.username,
        'user_id': user.id,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'settings': {'favorite_language': profile.favorite_language},
        'cache_token': cache_token.key,
    }
    if session_auth:
        payload['token'] = token_obj.key
    return payload


def _skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
