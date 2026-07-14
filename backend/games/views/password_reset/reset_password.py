"""View for setting a new password using a recovery token."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...models import PasswordResetToken
from ._shared import INVALID_OR_EXPIRED_TOKEN_ERROR


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Set a new password using a valid, unexpired, unused recovery token."""
    token_value = request.data.get('token', '')
    password = request.data.get('password', '')

    reset_token = PasswordResetToken.objects.filter(token=token_value).first()
    if reset_token is None or not reset_token.is_valid():
        return Response(INVALID_OR_EXPIRED_TOKEN_ERROR, status=400)

    reset_token.consume(password)

    return Response({'reset': True})
