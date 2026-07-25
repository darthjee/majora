"""View for setting a new password using a recovery token."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import PasswordResetToken

from ._shared import INVALID_OR_EXPIRED_TOKEN_ERROR, _is_denied


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Set a new password using a valid, unexpired, unused recovery token.

    A token belonging to a now-`denied` user is rejected with the same generic response
    as an invalid/expired token, so that a `denied` account's status can't be inferred
    from a distinguishable response at this stage (see `recover.py` for why the check
    isn't made earlier, at issuance time).
    """
    token_value = request.data.get('token', '')
    password = request.data.get('password', '')

    reset_token = PasswordResetToken.objects.filter(token=token_value).first()
    if reset_token is None or not reset_token.is_valid() or _is_denied(reset_token.user):
        return Response(INVALID_OR_EXPIRED_TOKEN_ERROR, status=400)

    reset_token.consume(password)

    return Response({'reset': True})
