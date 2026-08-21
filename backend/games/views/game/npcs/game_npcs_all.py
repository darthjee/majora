"""View for listing all NPCs (including hidden) in a game — DM/superuser only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ....models import Game
from ....serializers import CharacterFullListSerializer
from ...common import check_game_edit, paginated_list_response
from .._character._shared import _filter_characters, _with_treasure_value


@api_view(['GET'])
@permission_classes([AllowAny])
def game_npcs_all(request, game_slug):
    """Return all NPCs (including hidden) for a game — DM/superuser only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    error_response = check_game_edit(request, game)
    if error_response:
        return error_response
    npcs = game.characters.filter(npc=True)
    npcs = _filter_characters(
        request, npcs,
        allegiance_fields=('public_allegiance', 'private_allegiance'),
        slain_fields=('public_slain', 'private_slain'),
        hidden_field='hidden',
    )
    npcs = _with_treasure_value(npcs)
    response = paginated_list_response(request, npcs, CharacterFullListSerializer)
    response['X-Skip-Cache'] = 'true'
    return response
