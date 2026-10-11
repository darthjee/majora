"""View dispatching the staff copy of one source entity to its copy type's registry entry."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.views.common import require_staff

from ._staff_copy_shared import find_copy_type, resolve_target_game, same_game_error


@restricted
@api_view(['POST'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_copy_create(request, copy_type, source_id):
    """Copy the `copy_type` entity `source_id` into the `target` game."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    entry, error_response = find_copy_type(copy_type)
    if error_response:
        return error_response

    target_game, error_response = resolve_target_game(request.data)
    if error_response:
        return error_response

    return _copy_source(request, entry, source_id, target_game)


def _copy_source(request, entry, source_id, target_game):
    """Load the source (`404` if missing), reject its own game (`400`), then hand off."""
    source = entry.find_source(source_id)
    if source is None:
        return Response(status=404)
    if source.game_id == target_game.id:
        return same_game_error('target')
    return entry.copy(request, source, target_game)
