"""View for the login-status endpoint."""

from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import UserProfile

from ._shared import _authenticate_from_session


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status(request):
    """Report whether the requesting token (if any) is logged in."""
    result, session_auth = _resolve_authentication(request)

    if result is None:
        return _skip_cache(Response({'logged_in': False}))

    user, token_obj = result
    payload = _build_payload(user, token_obj, session_auth)
    return _skip_cache(Response(payload))


def _resolve_authentication(request):
    """Return a (result, session_auth) tuple, trying token then session authentication."""
    auth = TokenAuthentication()
    try:
        result = auth.authenticate(request)
    except Exception:
        result = None

    if result is not None:
        return result, False

    return _authenticate_from_session(request)


def _build_payload(user, token_obj, session_auth):
    """Build the logged-in status payload for `user`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    payload = {
        'logged_in': True,
        'username': user.username,
        'user_id': user.id,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'settings': {'favorite_language': profile.favorite_language},
    }
    if session_auth:
        payload['token'] = token_obj.key
    return payload


def _skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
