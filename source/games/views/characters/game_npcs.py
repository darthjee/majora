"""View for listing a game's visible Non-Player Characters (NPCs), or creating one."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game
from ...permissions import GameEditPermission
from ...serializers import (
    CharacterCreateSerializer,
    CharacterDetailSerializer,
    CharacterListSerializer,
)
from ..common import paginated_list_response, save_or_error, validated_or_error
from ._shared import _filter_characters


@api_view(['GET', 'POST'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; POST authorization is enforced inline
# inside _create_npc via GameEditPermission.check().
@permission_classes([AllowAny])
def game_npcs(request, game_slug):
    """Return list of Non-Player Characters (NPCs) for a specific game, or create one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        return _create_npc(request, game)

    npcs = game.characters.filter(npc=True, hidden=False)
    npcs = _filter_characters(request, npcs)
    return paginated_list_response(request, npcs, CharacterListSerializer)


def _create_npc(request, game):
    """Validate the request and create a new NPC for the game, returning 201 detail data."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = CharacterCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character, error_response = save_or_error(serializer, game=game, npc=True)
    if error_response:
        return error_response
    detail = CharacterDetailSerializer(character, context={'request': request})
    return Response(detail.data, status=201)
