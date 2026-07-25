"""View for requesting a password recovery email."""

from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import UserProfile

from ._shared import _create_and_send_reset_token


@api_view(['POST'])
@permission_classes([AllowAny])
def recover(request):
    """Send a password recovery email if the given address matches a user."""
    email = request.data.get('email', '')
    user = User.objects.filter(email=email).first()

    if user is not None:
        if _is_denied(user):
            return Response(status=403)
        _create_and_send_reset_token(user)

    return Response({'sent': True})


def _is_denied(user):
    """Return whether `user`'s profile status is `denied`."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.status == UserProfile.STATUS_DENIED
