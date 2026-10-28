"""View returning the unique-visitors count of a rolling period, staff/superuser only."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff
from statistics.aggregation import SummaryParamsParser, UniqueVisitorsCount


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_summary(request):
    """Return the unique visitors of the `period` window ending today in `tz`."""
    error_response = require_staff(request)
    if error_response:
        return error_response
    summary, errors = SummaryParamsParser(request.query_params).parse()
    if errors:
        return Response({'errors': errors}, status=400)
    unique_visitors = UniqueVisitorsCount(summary.filters).count()
    return Response({**summary.as_dict(), 'unique_visitors': unique_visitors})
