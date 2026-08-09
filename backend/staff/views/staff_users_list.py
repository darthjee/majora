"""View for listing all users, restricted to staff/superuser accounts."""

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from accounts.models import UserProfile
from games.decorators import restricted
from games.views.common import paginated_list_response, require_staff

from ..serializers import StaffUserListSerializer


@restricted
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

    queryset, error_response = _filtered_queryset(request)
    if error_response:
        return error_response

    return paginated_list_response(request, queryset, StaffUserListSerializer)


def _filtered_queryset(request):
    """Return a `(queryset, None)` tuple, or `(None, Response)` if `status` is invalid."""
    queryset = User.objects.select_related('profile').all().order_by('id')
    queryset, error_response = _filter_by_status(request, queryset)
    if error_response:
        return None, error_response
    return _filter_by_search(request, queryset), None


def _filter_by_status(request, queryset):
    """Narrow `queryset` to the exact `status` query param, validating it against choices."""
    status = request.query_params.get('status')
    if not status:
        return queryset, None
    if status not in dict(UserProfile.STATUS_CHOICES):
        errors = {'status': ['invalid_status']}
        return None, Response({'errors': errors}, status=400)
    return queryset.filter(profile__status=status), None


def _filter_by_search(request, queryset):
    """Narrow `queryset` by a case-insensitive substring match on name/display_name/email."""
    search = request.query_params.get('search')
    if not search:
        return queryset
    return queryset.filter(
        Q(username__icontains=search)
        | Q(profile__display_name__icontains=search)
        | Q(email__icontains=search)
    )
