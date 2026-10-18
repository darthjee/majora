"""View returning the scope catalogue and reachable games for the token create form."""

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.api_tokens import reachable_games, reaches_all_games
from accounts.scopes import SCOPES
from accounts.serializers import ApiTokenGameSerializer
from games.decorators import restricted

from ._shared import session_owner_error


@restricted
@api_view(['GET'])
@parser_classes([JSONParser])
# AllowAny: authentication is enforced inline via require_session/require_authenticated so
# scoped-token or anonymous callers receive a proper 403/401.
@permission_classes([AllowAny])
def api_token_options(request):
    """Return the sorted scope catalogue, the reachable games and the `all_games` flag."""
    error_response = session_owner_error(request)
    if error_response:
        return error_response
    games = reachable_games(request.user).order_by('name', 'game_slug')
    return Response({
        'scopes': sorted(SCOPES),
        'games': ApiTokenGameSerializer(games, many=True).data,
        'all_games': reaches_all_games(request.user),
    })
