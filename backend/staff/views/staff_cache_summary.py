"""View for reading the process-wide memory cache size/limit, restricted to staff/superuser."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff
from majora_project.cache import memory_cache


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_cache_summary(request):
    """Return the current memory cache size and limit, in bytes."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    return Response(memory_cache.summary())
