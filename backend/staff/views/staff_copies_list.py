"""View dispatching the staff copy list of one copy type to its registry entry."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from games.decorators import restricted
from games.views.common import require_staff

from ._staff_copy_shared import find_copy_type, resolve_list_games


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_copies_list(request, copy_type):
    """Return the `copy_type` entities of the `from` game, as listed for the `to` game."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    entry, error_response = find_copy_type(copy_type)
    if error_response:
        return error_response

    from_game, to_game, error_response = resolve_list_games(request.query_params)
    if error_response:
        return error_response

    return entry.list(request, from_game, to_game)
