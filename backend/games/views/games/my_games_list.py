"""View listing the current user's games, each with role, character, and conversation counts."""

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ...authentication import CookieTokenAuthentication
from ...serializers import MyGamesItemSerializer
from ...serializers.games.my_games._my_games_builder import MyGamesBuilder
from ..common import require_authenticated


@api_view(['GET'])
@authentication_classes([CookieTokenAuthentication])
# AllowAny: authentication is enforced inline via require_authenticated, so
# unauthenticated callers receive the UNAUTHENTICATED_RESPONSE_DATA 401 shape.
@permission_classes([AllowAny])
def my_games_list(request):
    """Return the requesting user's games, each with role, character, and conversation counts."""
    error_response = require_authenticated(request)
    if error_response:
        return error_response

    items = MyGamesBuilder(request.user).build()
    serializer = MyGamesItemSerializer(items, many=True)
    return Response(serializer.data)
