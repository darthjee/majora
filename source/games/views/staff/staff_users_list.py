"""View for listing all users, restricted to staff/superuser accounts."""

from django.contrib.auth.models import User
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...serializers import StaffUserListSerializer
from ..common import paginated_list_response, require_staff


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_users_list(request):
    """Return a paginated list of all users, for staff/superuser accounts only."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    response = paginated_list_response(
        request, User.objects.all().order_by('id'), StaffUserListSerializer
    )
    response['X-Skip-Cache'] = 'true'
    return response
