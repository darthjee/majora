"""Views for game master (DM) endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Game, GameMaster
from ..serializers import GameMasterSerializer


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_masters_list(request, game_slug):
    """Return all DM assignments for a game, or create a new one."""
    game = get_object_or_404(Game, game_slug=game_slug)

    if request.method == 'POST':
        if not request.user or not request.user.is_authenticated:
            return Response({'errors': {'detail': ['authentication required']}}, status=401)
        if GameMaster.objects.filter(game=game, user=request.user).exists():
            return Response({'errors': {'detail': ['user is already a game master']}}, status=400)
        game_master = GameMaster.objects.create(game=game, user=request.user)
        serializer = GameMasterSerializer(game_master)
        return Response(serializer.data, status=201)

    game_masters = game.game_masters.all()
    serializer = GameMasterSerializer(game_masters, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([AllowAny])
def game_master_detail(request, game_slug, game_master_id):
    """Remove a DM assignment."""
    game = get_object_or_404(Game, game_slug=game_slug)
    game_master = get_object_or_404(GameMaster, id=game_master_id, game=game)

    if not request.user or not request.user.is_authenticated:
        return Response({'errors': {'detail': ['authentication required']}}, status=401)
    if not request.user.is_superuser and game_master.user_id != request.user.id:
        return Response(
            {'errors': {'detail': ['not allowed to remove this game master']}}, status=403
        )

    game_master.delete()
    return Response(status=204)
