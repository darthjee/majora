"""View for deleting a user's password-recovery token outright."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import PasswordResetToken
from games.decorators import restricted
from games.views.common import require_staff

from ._recovery_token_shared import log_recovery_token_action


@restricted
@api_view(['DELETE'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_recovery_token_delete(request, user_id, token_id):
    """Delete a token row outright, regardless of its current state."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    token = get_object_or_404(PasswordResetToken, pk=token_id, user_id=user_id)
    log_recovery_token_action('delete', token.pk, user_id, request.user.id)
    token.delete()
    return Response(status=204)
