"""View for the entity-agnostic game-exclusive treasure permissions-check endpoint (#926)."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ._treasure_permissions import treasure_permissions_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_treasure_permissions(request):
    """Return whether the requester (real or role-simulated) may edit a game-exclusive treasure."""
    return treasure_permissions_response(request, scoped=True)
