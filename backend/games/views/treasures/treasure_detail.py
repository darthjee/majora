"""View for retrieving or updating a single treasure's detail."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import CookieTokenAuthentication
from permissions import EndpointPermission

from ...models import GameTreasure, Treasure
from ...serializers import TreasureDetailSerializer, TreasureUpdateSerializer
from ..common import detail_or_update, validate_with_hidden_field


@api_view(['GET', 'PATCH'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: GET is intentionally public; PATCH authentication/authorisation is
# enforced inline in detail_or_update/_patch_treasure via _check_treasure_edit().
@permission_classes([AllowAny])
def treasure_detail(request, treasure_id):
    """Return or update detail for a specific treasure identified by treasure_id."""
    try:
        treasure = Treasure.objects.get(pk=treasure_id)
    except Treasure.DoesNotExist:
        return Response({'errors': {'detail': ['not_found']}}, status=404)

    if request.method == 'PATCH':
        return _patch_treasure(request, treasure)
    return detail_or_update(
        request, treasure, _check_treasure_edit, TreasureUpdateSerializer,
        TreasureDetailSerializer,
    )


def _check_treasure_edit(request, treasure):
    """Return an error Response if `request.user` may not edit `treasure`, else None.

    Never dm-aware: a game-exclusive treasure's DM must use the `game_treasure_detail`
    endpoint (`game`/`restricted`/`edit`) instead — this check never resolves a `game`, so
    the base admin/dm shortcut only ever grants via admin. `edit` (no owning game) also
    allows staff; `edit_scoped` (has an owning game) does not, matching
    `Treasure.can_be_edited_by`'s `self.game_id is None` condition.
    """
    action = 'edit' if treasure.game_id is None else 'edit_scoped'
    return EndpointPermission(request.user).check(request, 'treasure', 'restricted', action)


def _patch_treasure(request, treasure):
    """Validate permission/payload, persist the update, and mirror `hidden` when game-scoped.

    A treasure exclusive to a game (`game_id` set) still accepts `hidden` in the body, writing
    it onto that treasure's own `GameTreasure` row; a fully global treasure has no game to scope
    `hidden` to, so it is silently dropped (matching this endpoint's existing "ignored field"
    convention, e.g. `game` in the body is never honored either).
    """
    error_response = _check_treasure_edit(request, treasure)
    if error_response:
        return error_response

    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    hidden_serializer, error_response = validate_with_hidden_field(serializer, request.data)
    if error_response:
        return error_response

    serializer.save()
    if treasure.game_id is not None and 'hidden' in hidden_serializer.validated_data:
        GameTreasure.objects.filter(game_id=treasure.game_id, treasure=treasure).update(
            hidden=hidden_serializer.validated_data['hidden'],
        )
    return Response(TreasureDetailSerializer(treasure).data)
