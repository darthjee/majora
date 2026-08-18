"""View for clearing the process-wide memory cache, restricted to staff/superuser."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff
from majora_project.cache import memory_cache


@restricted
@api_view(['DELETE'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_cache_clear(request):
    """Clear the entire process-wide memory cache."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    memory_cache.clear()
    return Response(status=204)
