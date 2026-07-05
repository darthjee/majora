"""View for retrieving or updating a single user's detail, restricted to staff/superuser."""

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...serializers import StaffUserDetailSerializer, StaffUserUpdateSerializer
from ..common import require_staff, validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_user_detail(request, user_id):
    """Return or update detail for a specific user identified by user_id."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    user = get_object_or_404(User, pk=user_id)

    if request.method == 'PATCH':
        return _update_user(request, user)

    return _skip_cache(Response(StaffUserDetailSerializer(user).data))


def _update_user(request, user):
    """Validate the payload, persist the update, then return the detail Response."""
    serializer = StaffUserUpdateSerializer(user, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return _skip_cache(Response(StaffUserDetailSerializer(user).data))


def _skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
