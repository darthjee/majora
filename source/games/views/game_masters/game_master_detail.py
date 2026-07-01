"""View for removing a DM assignment."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...models import Game, GameMaster
from ..common import require_authenticated


@api_view(['DELETE'])
@authentication_classes([CookieTokenAuthentication])
@permission_classes([AllowAny])
def game_master_detail(request, game_slug, game_master_id):
    """Remove a DM assignment."""
    game = get_object_or_404(Game, game_slug=game_slug)
    game_master = get_object_or_404(GameMaster, id=game_master_id, game=game)

    error_response = require_authenticated(request)
    if error_response:
        return error_response

    error_response = _check_removal_permission(request, game_master)
    if error_response:
        return error_response

    game_master.delete()
    return Response(status=204)


def _check_removal_permission(request, game_master):
    """Return a 403 Response if the requesting user may not remove `game_master`, else None."""
    if not request.user.is_superuser and game_master.user_id != request.user.id:
        return Response(
            {'errors': {'detail': ['not allowed to remove this game master']}}, status=403
        )
    return None
