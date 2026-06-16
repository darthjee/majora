"""Views for game-level endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Game
from ..serializers import GameDetailSerializer, GameListSerializer


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
