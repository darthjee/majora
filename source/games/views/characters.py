"""Views for character-level endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Character, Game
from ..paginator import Paginator
from ..serializers import (
    CharacterDetailSerializer,
    CharacterListSerializer,
    CharacterUpdateSerializer,
)


@api_view(['GET'])
def game_pcs(request, game_slug):
    """Return list of Player Characters (PCs) for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    pcs = game.characters.filter(npc=False)
    page_pcs, headers = Paginator(request, pcs).paginate()
    serializer = CharacterListSerializer(page_pcs, many=True)
    return Response(serializer.data, headers=headers)


@api_view(['GET'])
def game_npcs(request, game_slug):
    """Return list of Non-Player Characters (NPCs) for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    npcs = game.characters.filter(npc=True)
    page_npcs, headers = Paginator(request, npcs).paginate()
    serializer = CharacterListSerializer(page_npcs, many=True)
    return Response(serializer.data, headers=headers)


@api_view(['GET'])
def game_npc_detail(request, game_slug, character_id):
    """Return detail for a specific NPC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)
    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_detail(request, game_slug, character_id):
    """Return or update detail for a specific PC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)

    if request.method == 'PATCH':
        return _update_pc(request, character)

    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)


def _update_pc(request, character):
    """Validate permissions and payload, then persist updates to a PC."""
    if not request.user or not request.user.is_authenticated:
        return Response({'errors': {'detail': ['authentication required']}}, status=401)
    if not character.can_be_edited_by(request.user):
        return Response(
            {'errors': {'detail': ['not allowed to edit this character']}}, status=403
        )

    serializer = CharacterUpdateSerializer(character, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    serializer.save()
    detail = CharacterDetailSerializer(character, context={'request': request})
    return Response(detail.data)
