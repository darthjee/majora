"""View for un-expiring (reviving) a user's password-recovery token."""

from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import PasswordResetToken
from games.decorators import restricted
from games.settings import Settings
from games.views.common import require_staff

from ._recovery_token_shared import log_recovery_token_action


@restricted
@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_recovery_token_unexpire(request, user_id, token_id):
    """Clear a token's invalidation and extend its expiration, without touching `used_at`."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    token = get_object_or_404(PasswordResetToken, pk=token_id, user_id=user_id)
    _unexpire(token)
    log_recovery_token_action('unexpire', token.pk, user_id, request.user.id)
    return Response({})


def _unexpire(token):
    """Clear `invalidated_at` and push `expires_at` forward by the configured expiration."""
    minutes = Settings.password_reset_token_expiration_minutes()
    token.invalidated_at = None
    token.expires_at = timezone.now() + timedelta(minutes=minutes)
    token.save()
