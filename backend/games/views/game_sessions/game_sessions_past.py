"""View for listing a game's past sessions."""

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ._shared import game_sessions_list_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_sessions_past(request, game_slug):
    """Return a paginated list of a game's past sessions, most recent first."""
    today = timezone.now().date()
    return game_sessions_list_response(
        request, game_slug, lambda sessions: sessions.filter(date__lt=today).order_by('-date'),
    )
