"""View for listing a user's password-recovery tokens, restricted to staff/superuser accounts."""

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..serializers import StaffRecoveryTokenSerializer


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_recovery_tokens(request, user_id):
    """Return every password-recovery token for the given user, newest first."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    user = get_object_or_404(User, pk=user_id)
    tokens = user.password_reset_tokens.order_by('-created_at')
    return Response(StaffRecoveryTokenSerializer(tokens, many=True).data)
