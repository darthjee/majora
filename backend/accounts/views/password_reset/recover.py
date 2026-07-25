"""View for requesting a password recovery email."""

from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ._shared import _create_and_send_reset_token


@api_view(['POST'])
@permission_classes([AllowAny])
def recover(request):
    """Send a password recovery email if the given address matches a user.

    A token is created and emailed for any matching user, regardless of their approval
    status: denying `denied` users at this stage would let an unauthenticated caller
    distinguish `denied` from `pending`/`approved` accounts via the side effects (token
    creation, email dispatch) even though the response itself is uniform. Instead, `denied`
    users are rejected later, at token-consumption time (see `reset_password.py`).
    """
    email = request.data.get('email', '')
    user = User.objects.filter(email=email).first()

    if user is not None:
        _create_and_send_reset_token(user)

    return Response({'sent': True})
