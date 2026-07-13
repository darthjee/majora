"""Readiness check view."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@authentication_classes([])
# Public endpoint: returns static status data only; no authentication required.
@permission_classes([AllowAny])
def ready(request):
    """Return a readiness check response, always bypassing cache."""
    response = Response({'status': 'ok'})
    response['X-Skip-Cache'] = 'true'
    return response
