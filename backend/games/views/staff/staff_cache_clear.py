"""View for clearing the process-wide memory cache, restricted to staff/superuser."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from majora_project.cache import memory_cache

from ..common import require_staff


@api_view(['DELETE'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_cache_clear(request):
    """Clear the entire process-wide memory cache."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    memory_cache.clear()
    return _skip_cache(Response(status=204))


def _skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
