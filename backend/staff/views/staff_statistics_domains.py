"""View listing every `Domain` for the access statistics domain filter, staff/superuser only."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from domains.models import Domain
from games.decorators import restricted
from games.views.common import require_staff


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_domains(request):
    """Return every domain as `[{id, domain}]`, ordered by `domain`, unpaginated."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    return Response(list(Domain.objects.order_by('domain').values('id', 'domain')))
