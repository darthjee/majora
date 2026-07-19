"""View for generating a password-recovery link for a user, without sending email."""

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from accounts.views.password_reset._shared import build_recovery_url, get_or_create_recovery_token

from ..common import require_staff


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_recovery_link(request, user_id):
    """Return a password-recovery URL for the given user, reusing a valid token if any."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    user = get_object_or_404(User, pk=user_id)

    token = get_or_create_recovery_token(user)
    response = Response({'url': build_recovery_url(token)})
    response['X-Skip-Cache'] = 'true'
    return response
