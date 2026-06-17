"""Views for character-level endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Character, Game
from ..paginator import Paginator
from ..serializers import CharacterDetailSerializer, CharacterListSerializer


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
def character_detail(request, game_slug, character_id):
    """Return detail for a specific character in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game)
    serializer = CharacterDetailSerializer(character)
    return Response(serializer.data)
