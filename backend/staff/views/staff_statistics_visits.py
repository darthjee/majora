"""View returning the visits-over-time series of the access statistics, staff/superuser only."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff
from statistics.aggregation import VisitsSeries

from ._staff_statistics_shared import parse_statistics_filters, statistics_envelope


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_visits(request):
    """Return the anonymous / logged-in visit counts per bucket and their totals."""
    error_response = require_staff(request)
    if error_response:
        return error_response
    filters, error_response = parse_statistics_filters(request)
    if error_response:
        return error_response
    buckets, totals = VisitsSeries(filters).build()
    return Response(statistics_envelope(filters, buckets, totals))
