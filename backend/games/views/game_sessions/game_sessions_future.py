"""View for listing a game's future (including today) sessions."""

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ._shared import game_sessions_list_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_sessions_future(request, game_slug):
    """Return a paginated list of a game's future sessions, soonest first."""
    today = timezone.now().date()
    return game_sessions_list_response(
        request, game_slug, lambda sessions: sessions.filter(date__gte=today).order_by('date'),
    )
