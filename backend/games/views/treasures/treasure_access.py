"""View for the treasure access-check endpoint."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Treasure
from ...serializers import TreasureAccessSerializer
from ..common import access_response


@api_view(['GET'])
# AllowAny: access-check endpoints are intentionally open so the UI can adapt
# before the user logs in, matching the game/pc/npc access endpoints.
@permission_classes([AllowAny])
def treasure_access(request, treasure_id):
    """Return whether the requesting user may edit a specific treasure."""
    treasure = Treasure.objects.filter(pk=treasure_id).first()
    return access_response(TreasureAccessSerializer, treasure, request)
