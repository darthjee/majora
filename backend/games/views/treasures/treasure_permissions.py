"""View for the treasure permissions-check endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ...models import Treasure
from ...serializers import TreasurePermissionsSerializer
from ..common import parse_role_booleans, permissions_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: permission-check endpoints are intentionally open so the UI can adapt
# before the user logs in, matching the game/pc/npc permissions endpoints.
@permission_classes([AllowAny])
def treasure_permissions(request, treasure_id):
    """Return whether the requester (real or role-simulated) may edit a specific treasure."""
    treasure = Treasure.objects.filter(pk=treasure_id).first()
    role_booleans = parse_role_booleans(request)
    return permissions_response(TreasurePermissionsSerializer, treasure, request, role_booleans)
