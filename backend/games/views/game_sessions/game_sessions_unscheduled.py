"""View for listing a game's unscheduled (dateless) sessions."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ._shared import game_sessions_list_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_sessions_unscheduled(request, game_slug):
    """Return a paginated list of a game's unscheduled sessions, ordered by id."""
    return game_sessions_list_response(
        request, game_slug, lambda sessions: sessions.filter(date__isnull=True),
    )
