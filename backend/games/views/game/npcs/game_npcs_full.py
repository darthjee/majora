"""View for creating an NPC with the full (private-field-included) field set — DM/admin only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ....models import Game
from ....serializers import CharacterCreateSerializer, CharacterDetailSerializer
from ...common import check_game_edit, save_or_error, validated_or_error


@api_view(['POST'])
@permission_classes([AllowAny])
def game_npcs_full(request, game_slug):
    """Create a new NPC with the full field set for a game — DM/admin/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
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
    response = Response(detail.data, status=201)
    # The whole response is gated behind check_game_edit() above, so it must
    # never be cached/shared across requesters by Tent's identity-blind reverse-proxy
    # cache, which would otherwise replay one caller's authorized 201 response to any
    # subsequent, unauthorized caller of the same URL.
    response['X-Skip-Cache'] = 'true'
    return response
