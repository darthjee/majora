"""View for clearing recorded crawler debug emissions, restricted to staff/superuser.

Temporary debug harness — see `docs/agents/specs/crawler-test-harness.md`. The live
`staff/crawler.json` route reaches `staff_crawler` (which delegates its `DELETE` branch to
`clear_crawler_emissions`); `staff_crawler_clear` is re-exported and unit-tested on its own
even though no URL routes to it directly.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ..models import CrawlerDebugEmission


def clear_crawler_emissions():
    """Delete every recorded crawler debug emission (blanket clear)."""
    CrawlerDebugEmission.objects.all().delete()


@restricted
@api_view(['DELETE'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_crawler_clear(request):
    """Delete every recorded crawler debug emission."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    clear_crawler_emissions()
    return Response(status=204)
