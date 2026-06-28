"""Views for game-level endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Game
from ..paginator import Paginator
from ..permissions import GameEditPermission
from ..serializers import (
    GameCreateSerializer,
    GameDetailSerializer,
    GameListSerializer,
    GameUpdateSerializer,
)


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def games_list(request):
    """Return a list of all games or create a new game."""
    if request.method == 'POST':
        return _create_game(request)

    page_games, headers = Paginator(request, Game.objects.all()).paginate()
    serializer = GameListSerializer(page_games, many=True)
    return Response(serializer.data, headers=headers)


def _create_game(request):
    """Validate request and create a new game, returning 201 with detail data."""
    if not request.user or not request.user.is_authenticated:
        return Response({'errors': {'detail': ['authentication required']}}, status=401)

    serializer = GameCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    game = serializer.save()
    detail = GameDetailSerializer(game)
    return Response(detail.data, status=201)


@api_view(['GET', 'PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_detail(request, game_slug):
    """Return or update detail for a specific game identified by game_slug."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'PATCH':
        return _update_game(request, game)

    serializer = GameDetailSerializer(game)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_access(request, game_slug):
    """Return whether the requesting user may edit a specific game."""
    game = Game.objects.filter(game_slug=game_slug).first()
    can_edit = _resolve_can_edit(request, game)
    response = Response({'can_edit': can_edit})
    response['X-Skip-Cache'] = 'true'
    return response


def _resolve_can_edit(request, game):
    """Return True if request.user may edit game, False otherwise."""
    if game is None:
        return False
    return game.can_be_edited_by(request.user)


def _update_game(request, game):
    """Validate permissions and payload, then persist updates to a game."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    serializer = GameUpdateSerializer(game, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    serializer.save()
    detail = GameDetailSerializer(game)
    return Response(detail.data)
