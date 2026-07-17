"""View for retrieving or updating a single treasure's detail."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import GameTreasure, Treasure
from ...permissions import TreasureEditPermission
from ...serializers import HiddenFieldSerializer, TreasureDetailSerializer, TreasureUpdateSerializer
from ..common import detail_or_update, validated_or_error


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authentication/authorisation is
# enforced inline in detail_or_update/_patch_treasure via TreasureEditPermission.check().
@permission_classes([AllowAny])
def treasure_detail(request, treasure_id):
    """Return or update detail for a specific treasure identified by treasure_id."""
    try:
        treasure = Treasure.objects.get(pk=treasure_id)
    except Treasure.DoesNotExist:
        return Response({'errors': {'detail': ['not found']}}, status=404)

    if request.method == 'PATCH':
        return _patch_treasure(request, treasure)
    return detail_or_update(
        request, treasure, TreasureEditPermission, TreasureUpdateSerializer,
        TreasureDetailSerializer,
    )


def _patch_treasure(request, treasure):
    """Validate permission/payload, persist the update, and mirror `hidden` when game-scoped.

    A treasure exclusive to a game (`game_id` set) still accepts `hidden` in the body, writing
    it onto that treasure's own `GameTreasure` row; a fully global treasure has no game to scope
    `hidden` to, so it is silently dropped (matching this endpoint's existing "ignored field"
    convention, e.g. `game` in the body is never honored either).
    """
    error_response = TreasureEditPermission.check(request, treasure)
    if error_response:
        return error_response

    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    hidden_serializer = HiddenFieldSerializer(data=request.data)
    error_response = validated_or_error(hidden_serializer)
    if error_response:
        return error_response

    serializer.save()
    if treasure.game_id is not None and 'hidden' in hidden_serializer.validated_data:
        GameTreasure.objects.filter(game_id=treasure.game_id, treasure=treasure).update(
            hidden=hidden_serializer.validated_data['hidden'],
        )
    return Response(TreasureDetailSerializer(treasure).data)
