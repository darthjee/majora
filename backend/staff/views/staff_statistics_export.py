"""View returning the raw access statistics sessions and their visits, staff/superuser only."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted, token_scopes
from games.paginator import Paginator
from games.views.common import require_staff
from staff.serializers import StaffStatisticsExportSessionSerializer
from statistics.aggregation import SessionExport, SessionExportVisits

from ._staff_statistics_shared import parse_statistics_filters


@restricted
@token_scopes(GET=['statistics:read'])
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers (scoped-token owners included) get a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_export(request):
    """Return a page of raw sessions created in the range, each with its in-range visits."""
    error_response = require_staff(request)
    if error_response:
        return error_response
    filters, error_response = parse_statistics_filters(request)
    if error_response:
        return error_response
    return _ExportPage(request, filters).response()


class _ExportPage:
    """Paginates the exported sessions and serializes them with one batched visits query."""

    def __init__(self, request, filters):
        """Store the request (for the pagination params) and the resolved filters."""
        self._request = request
        self._filters = filters

    def response(self):
        """Return the serialized page of sessions with the pagination headers."""
        page, headers = Paginator(self._request, SessionExport(self._filters).queryset()).paginate()
        sessions = list(page)
        return Response(self._serialize(sessions), headers=headers)

    def _serialize(self, sessions):
        """Serialize `sessions` with their batched, capped in-range visits."""
        visits = SessionExportVisits(self._filters).by_session(sessions)
        return StaffStatisticsExportSessionSerializer(
            sessions, many=True, context={'visits': visits},
        ).data
