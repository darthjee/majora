"""View for denying (or banning) a user, restricted to staff/superuser accounts."""

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import UserProfile
from games.decorators import restricted
from games.views.common import require_staff

from ..serializers import StaffUserListSerializer


@restricted
@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_deny(request):
    """Deny (or ban) a user, identified by `user_id` in the request body, from any status."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    user_id, error_response = _parse_user_id(request)
    if error_response:
        return error_response

    user = get_object_or_404(User, pk=user_id)
    profile, _ = UserProfile.objects.get_or_create(user=user)

    profile.status = UserProfile.STATUS_DENIED
    profile.save(update_fields=['status'])
    Token.objects.filter(user=user).delete()

    return Response(StaffUserListSerializer(user).data)


def _parse_user_id(request):
    """Return a `(user_id, None)` tuple, or `(None, Response)` if it's not an integer."""
    try:
        return int(request.data.get('user_id')), None
    except (TypeError, ValueError):
        errors = {'user_id': ['invalid_user_id']}
        return None, Response({'errors': errors}, status=400)
