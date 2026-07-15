"""View for listing a game's future (including today) sessions."""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ...models import Game
from ...serializers import GameSessionListSerializer
from ..common import paginated_list_response


@api_view(['GET'])
@permission_classes([AllowAny])
def game_sessions_future(request, game_slug):
    """Return a paginated list of a game's future sessions, soonest first."""
    game = get_object_or_404(Game, game_slug=game_slug)
    today = timezone.now().date()
    sessions = game.sessions.filter(date__gte=today).order_by('date')

    return paginated_list_response(request, sessions, GameSessionListSerializer)
