"""View for the registration endpoint."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ._shared import _create_registered_user, _validate_register_payload, send_welcome_email


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Create a new user account, returning an auth token for auto-login."""
    error = _validate_register_payload(request.data)
    if error is not None:
        return Response({'error': error}, status=400)

    user, token = _create_registered_user(request.data)
    request.session['auth_token'] = token.key
    send_welcome_email(user)

    return Response({'username': user.username, 'token': token.key}, status=201)
