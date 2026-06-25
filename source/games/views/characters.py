"""Views for character-level endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Character, Game
from ..paginator import Paginator
from ..permissions import CharacterEditPermission
from ..serializers import (
    CharacterDetailSerializer,
    CharacterFullSerializer,
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


@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npc_detail(request, game_slug, character_id):
    """Return or update detail for a specific NPC in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)

    if request.method == 'PATCH':
        return _update_character(request, character)

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
        return _update_character(request, character)

    serializer = CharacterDetailSerializer(character, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npc_full(request, game_slug, character_id):
    """Return full detail (including private description) for a specific NPC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)
    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response
    serializer = CharacterFullSerializer(character, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_full(request, game_slug, character_id):
    """Return full detail (including private description) for a specific PC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)
    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response
    serializer = CharacterFullSerializer(character, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_pc_access(request, game_slug, character_id):
    """Return whether the requesting user may edit a specific PC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=False)
    can_edit = character.can_be_edited_by(request.user)
    response = Response({'can_edit': can_edit})
    response['X-Skip-Cache'] = 'true'
    return response


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_npc_access(request, game_slug, character_id):
    """Return whether the requesting user may edit a specific NPC."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game, npc=True)
    can_edit = character.can_be_edited_by(request.user)
    response = Response({'can_edit': can_edit})
    response['X-Skip-Cache'] = 'true'
    return response


def _update_character(request, character):
    """Validate permissions and payload, then persist updates to a character."""
    error_response = CharacterEditPermission.check(request, character)
    if error_response:
        return error_response

    serializer = CharacterUpdateSerializer(character, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    serializer.save()
    detail = CharacterDetailSerializer(character, context={'request': request})
    return Response(detail.data)
