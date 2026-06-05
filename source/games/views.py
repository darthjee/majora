"""Views for the games app."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Character, Game
from .serializers import (
    CharacterDetailSerializer,
    CharacterListSerializer,
    GameDetailSerializer,
    GameListSerializer,
)


@api_view(['GET'])
def games_list(request):
    """Return a list of all games."""
    games = Game.objects.all()
    serializer = GameListSerializer(games, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def game_detail(request, game_slug):
    """Return detail for a specific game identified by game_slug."""
    game = get_object_or_404(Game, game_slug=game_slug)
    serializer = GameDetailSerializer(game)
    return Response(serializer.data)


@api_view(['GET'])
def game_pcs(request, game_slug):
    """Return list of Player Characters (PCs) for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    pcs = game.characters.filter(player__isnull=False)
    serializer = CharacterListSerializer(pcs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def game_npcs(request, game_slug):
    """Return list of Non-Player Characters (NPCs) for a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    npcs = game.characters.filter(player__isnull=True)
    serializer = CharacterListSerializer(npcs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def character_detail(request, game_slug, character_id):
    """Return detail for a specific character in a game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = get_object_or_404(Character, id=character_id, game=game)
    serializer = CharacterDetailSerializer(character)
    return Response(serializer.data)
