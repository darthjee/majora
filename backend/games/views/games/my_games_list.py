"""View listing the current user's games, each with role, character, and conversation counts."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import ApiToken

from ...decorators import token_scopes
from ...serializers import MyGamesItemSerializer
from ...serializers.games.my_games._my_games_builder import MyGamesBuilder
from ..common import require_authenticated


@token_scopes(GET=['games:read'])
@api_view(['GET'])
# AllowAny: authentication is enforced inline via require_authenticated, so
# unauthenticated callers receive the UNAUTHENTICATED_RESPONSE_DATA 401 shape.
@permission_classes([AllowAny])
def my_games_list(request):
    """Return the requesting user's games, each with role, character, and conversation counts."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    items = MyGamesBuilder(request.user, game_ids=_token_game_ids(request)).build()
    serializer = MyGamesItemSerializer(items, many=True)
    return _skip_cache(Response(serializer.data))


def _token_game_ids(request):
    """Return the scoped token's game ids, or None when unrestricted (no token / empty list)."""
    api_token = getattr(request, 'auth', None)
    if not isinstance(api_token, ApiToken):
        return None
    return list(api_token.games.values_list('id', flat=True)) or None


def _skip_cache(response):
    """Set the X-Skip-Cache header on `response` and return it."""
    response['X-Skip-Cache'] = 'true'
    return response
