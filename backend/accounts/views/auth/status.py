"""View for the login-status endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ._shared import resolve_status_payload, skip_cache


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def status(request):
    """Report whether the requesting token (if any) is logged in and approved."""
    return skip_cache(Response(resolve_status_payload(request)))
