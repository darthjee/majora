"""View for approving a pending user, restricted to staff/superuser accounts."""

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from accounts.models import UserProfile

from ...serializers import StaffUserListSerializer
from ..common import require_staff


@api_view(['POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_approve(request):
    """Approve a `pending` user, identified by `user_id` in the request body."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    user = get_object_or_404(User, pk=request.data.get('user_id'))
    profile, _ = UserProfile.objects.get_or_create(user=user)

    error_response = _require_pending(profile)
    if error_response:
        return error_response

    profile.status = UserProfile.STATUS_APPROVED
    profile.save(update_fields=['status'])
    return _skip_cache(Response(StaffUserListSerializer(user).data))


def _require_pending(profile):
    """Return a 422 Response if `profile`'s status isn't `pending`, else None."""
    if profile.status != UserProfile.STATUS_PENDING:
        errors = {'status': ['user is not pending']}
        return _skip_cache(Response({'errors': errors}, status=422))
    return None


def _skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
