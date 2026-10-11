"""View listing every game, across all domains, for the staff copy page's game pickers."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from games.decorators import restricted
from games.models import Game
from games.views.common import require_staff

from ..serializers import StaffCopyGameSerializer


@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_copies_games(request):
    """Return every game ordered by name, unpaginated, ignoring domain and visibility."""
    error_response = require_staff(request)
    if error_response:
        return error_response

    games = Game.objects.prefetch_related('game_domain_groups').order_by('name', 'id')
    return Response(StaffCopyGameSerializer(games, many=True).data)
