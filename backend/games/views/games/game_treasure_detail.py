"""View for retrieving or updating a treasure linked to (or exclusive to) a specific game."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameTreasure, Treasure
from ...permissions import GameEditPermission
from ...serializers import (
    GameTreasureUpdateSerializer,
    TreasureDetailSerializer,
    TreasureUpdateSerializer,
)
from ..common import validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authorization is enforced inline via
# GameEditPermission.check() against the resolved game — distinct from, and does not
# alter, the superuser-only `/treasures/<id>.json` endpoint.
@permission_classes([AllowAny])
def game_treasure_detail(request, game_slug, treasure_id):
    """Return or update detail for a treasure linked to (or exclusive to) a specific game."""
    game = get_object_or_404(Game, game_slug=game_slug)
    treasure = _get_game_treasure_or_404(game, treasure_id)
    game_treasure = GameTreasure.objects.filter(game=game, treasure=treasure).first()

    error_response = _hidden_gate_response(game_treasure, game, request)
    if error_response:
        return error_response

    if request.method == 'PATCH':
        response = _update_game_treasure(request, game, treasure)
    else:
        response = Response(TreasureDetailSerializer(treasure, context={'game': game}).data)

    if game_treasure is not None and game_treasure.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def _get_game_treasure_or_404(game, treasure_id):
    """Return the Treasure matching `treasure_id`, exclusive to or M2M-linked to `game`."""
    treasures = Treasure.objects.filter(Q(game=game) | Q(linked_game=game)).distinct()
    return get_object_or_404(treasures, id=treasure_id)


def _hidden_gate_response(game_treasure, game, request):
    """Return a 404 Response with X-Skip-Cache set if hidden and game not editable."""
    is_hidden = game_treasure is not None and game_treasure.hidden
    if is_hidden and not game.can_be_edited_by(request.user):
        response = Response(status=404)
        response['X-Skip-Cache'] = 'true'
        return response
    return None


def _update_game_treasure(request, game, treasure):
    """Validate permission and payload, persist the update, then return the detail Response."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    if treasure.game_id == game.id:
        return _update_exclusive_treasure(request, game, treasure)
    return _update_linked_treasure(request, game, treasure)


def _update_exclusive_treasure(request, game, treasure):
    """Update name/value on the exclusive treasure, mirroring value/hidden onto its GameTreasure."""
    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    updates = {'value': treasure.value}
    if 'hidden' in request.data:
        updates['hidden'] = bool(request.data.get('hidden'))
    GameTreasure.objects.filter(game=game, treasure=treasure).update(**updates)
    return Response(TreasureDetailSerializer(treasure, context={'game': game}).data)


def _update_linked_treasure(request, game, treasure):
    """Update max_units on the GameTreasure row linking `treasure` to `game`."""
    game_treasure = get_object_or_404(GameTreasure, game=game, treasure=treasure)
    serializer = GameTreasureUpdateSerializer(game_treasure, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(TreasureDetailSerializer(treasure, context={'game': game}).data)
