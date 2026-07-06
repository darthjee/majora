"""View for retrieving or updating a single NPC's detail."""

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from ...authentication import CookieTokenAuthentication
from ...models import Character, Game
from ...permissions import CharacterEditPermission
from ...serializers import CharacterDetailSerializer, CharacterUpdateSerializer
from ..common import detail_or_update


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_npc_detail(request, game_slug, character_id):
    """Return or update detail for a specific NPC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)

    if character.hidden and not character.can_be_edited_by(request.user):
        raise Http404

    response = detail_or_update(
        request,
        character,
        CharacterEditPermission,
        CharacterUpdateSerializer,
        CharacterDetailSerializer,
        detail_context={'request': request},
    )
    response['X-Skip-Cache'] = 'true'
    return response
