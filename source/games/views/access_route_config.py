"""View for the static resource-kind config endpoint (page -> access-check mapping)."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..access_route_config import ACCESS_ROUTE_CONFIG


@api_view(['GET'])
@authentication_classes([])
# Public, static, non-paginated endpoint: same body for every caller, no auth dependency.
@permission_classes([AllowAny])
def access_route_config(request):
    """Return the static page -> resource-kind mapping consumed by the frontend."""
    return Response(ACCESS_ROUTE_CONFIG)
