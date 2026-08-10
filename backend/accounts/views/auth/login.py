"""View for the login endpoint."""

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import CacheToken, UserProfile

from ._shared import attach_statistics_session


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate a user, by username or email, and return an authentication token."""
    identifier = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=_resolve_username(identifier), password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=401)

    if _is_denied(user):
        return Response({'error': 'denied'}, status=403)

    token, _ = Token.objects.get_or_create(user=user)
    cache_token, _ = CacheToken.objects.get_or_create(user=user)
    request.session['auth_token'] = token.key
    attach_statistics_session(request, user)
    return Response({'token': token.key, 'cache_token': cache_token.key})


def _is_denied(user):
    """Return whether `user`'s profile status is `denied`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.status == UserProfile.STATUS_DENIED


def _resolve_username(identifier):
    """Resolve `identifier` (a username or email, case-insensitively) to a canonical username.

    Falls back to `identifier` unchanged when no user matches, so `authenticate()` still
    receives a value to check (and fails credential verification the same way it always has).
    """
    matched = User.objects.filter(
        Q(username__iexact=identifier) | Q(email__iexact=identifier)
    ).first()
    return matched.username if matched else identifier
