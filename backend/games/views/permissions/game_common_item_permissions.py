"""View for the entity-agnostic game common item permissions-check endpoint (issue #826)."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...serializers import GameCommonItemPermissionsSerializer
from ..common import parse_role_booleans, permissions_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_common_item_permissions(request):
    """Return whether the requester (real or role-simulated) may edit a game common item."""
    role_booleans = parse_role_booleans(request)
    return permissions_response(
        GameCommonItemPermissionsSerializer, None, request, role_booleans,
    )
