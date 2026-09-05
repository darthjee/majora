"""View for force-expiring (revoking) a user's password-recovery token."""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import PasswordResetToken
from games.decorators import restricted
from games.views.common import require_staff

from ._recovery_token_shared import log_recovery_token_action


@restricted
@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_recovery_token_force_expire(request, user_id, token_id):
    """Immediately invalidate a token, regardless of its current state."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    token = get_object_or_404(PasswordResetToken, pk=token_id, user_id=user_id)
    _force_expire(token)
    log_recovery_token_action('force-expire', token.pk, user_id, request.user.id)
    return Response({})


def _force_expire(token):
    """Set `invalidated_at` to now and persist the change."""
    token.invalidated_at = timezone.now()
    token.save()
