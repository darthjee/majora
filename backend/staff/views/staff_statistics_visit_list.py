"""View returning the paginated visit list of the access statistics, staff/superuser only."""

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from games.decorators import restricted
from games.views.common import paginated_list_response, require_staff
from staff.serializers import StaffStatisticsVisitSerializer
from statistics.aggregation import VisitList

from ._staff_statistics_shared import parse_sort, parse_statistics_filters


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_visit_list(request):
    """Return the paginated list of matched visits, descending on the requested sort."""
    error_response = require_staff(request)
    if error_response:
        return error_response
    sort, sort_errors = parse_sort(request, VisitList.SORT_KEYS, VisitList.DEFAULT_SORT)
    filters, error_response = parse_statistics_filters(request, sort_errors)
    if error_response:
        return error_response
    return paginated_list_response(
        request, VisitList(filters, sort).queryset(), StaffStatisticsVisitSerializer,
        context={'now': timezone.now()},
    )
