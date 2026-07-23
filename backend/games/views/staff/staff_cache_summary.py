"""View for reading the process-wide memory cache size/limit, restricted to staff/superuser."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from majora_project.cache import memory_cache

from ..common import require_staff


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_cache_summary(request):
    """Return the current memory cache size and limit, in bytes."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    response = Response(memory_cache.summary())
    response['X-Skip-Cache'] = 'true'
    return response
