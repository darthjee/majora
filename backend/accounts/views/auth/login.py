"""View for the login endpoint."""

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import UserProfile

from ._shared import attach_statistics_session


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate a user and return an authentication token."""
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=401)

    if _is_denied(user):
        return Response({'error': 'denied'}, status=403)

    token, _ = Token.objects.get_or_create(user=user)
    request.session['auth_token'] = token.key
    attach_statistics_session(request, user)
    return Response({'token': token.key})


def _is_denied(user):
    """Return whether `user`'s profile status is `denied`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.status == UserProfile.STATUS_DENIED
