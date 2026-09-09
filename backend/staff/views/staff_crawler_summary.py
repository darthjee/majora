"""View for the per-`type` crawler debug-emission summary, restricted to staff/superuser.

Temporary debug harness — see `docs/agents/specs/crawler-test-harness.md`. Deleted alongside
the rest of the harness once #1262's real import endpoint is trusted end-to-end.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..crawler_debug_emission_summary import CrawlerDebugEmissionSummary


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_crawler_summary(request):
    """Return recorded crawler debug-emission counts grouped by `type` (``{}`` when empty)."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    return Response(CrawlerDebugEmissionSummary().as_dict())
