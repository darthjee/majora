"""View for listing all users, restricted to staff/superuser accounts."""

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

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

    queryset = _filtered_queryset(request)
    response = paginated_list_response(request, queryset, StaffUserListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response


def _filtered_queryset(request):
    """Return all users, ordered by id, narrowed by the optional `status`/`search` params."""
    queryset = User.objects.select_related('profile').all().order_by('id')
    queryset = _filter_by_status(request, queryset)
    return _filter_by_search(request, queryset)


def _filter_by_status(request, queryset):
    """Narrow `queryset` to the exact `status` query param, when present."""
    status = request.query_params.get('status')
    if status:
        return queryset.filter(profile__status=status)
    return queryset


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
