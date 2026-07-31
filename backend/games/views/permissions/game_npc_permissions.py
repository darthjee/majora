"""View for the entity-agnostic NPC permissions-check endpoint (issue #926)."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from accounts.authentication import CookieTokenAuthentication

from ._character_permissions import character_permissions_response


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_permissions(request):
    """Return whether the requester (real or role-simulated) may edit an NPC."""
    return character_permissions_response(request, npc=True)
