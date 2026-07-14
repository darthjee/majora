"""View for the PC permissions-check endpoint."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from .....authentication import CookieTokenAuthentication
from .....models import Game
from .....serializers import CharacterPermissionsSerializer
from ....common import parse_role_booleans, permissions_response
from ..._shared import _find_character


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_pc_permissions(request, game_slug, character_id):
    """Return whether the requester (real or role-simulated) may edit a specific PC."""
    game = Game.objects.filter(game_slug=game_slug).first()
    character = _find_character(game, character_id, npc=False)
    role_booleans = parse_role_booleans(request)
    return permissions_response(CharacterPermissionsSerializer, character, request, role_booleans)
