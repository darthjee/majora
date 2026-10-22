"""View for listing an NPC's photos even when the NPC is hidden — NPC editors only."""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from ......decorators import token_scopes
from ......models import Game
from ...._character._full import _check_character_edit
from ...._character._shared import _get_character_or_404
from ....photos._photos import character_photos


@token_scopes(GET=['npcs:read'])
@api_view(['GET'])
# AllowAny: authorization for this whole endpoint is enforced inline via
# _check_character_edit() (CharacterEdit), checked before the hidden state is consulted,
# so unauthenticated/non-editor callers get the app's own 401/403 payload.
@permission_classes([AllowAny])
def game_npc_photos_all(request, game_slug, character_id):
    """Return the ready photos of an NPC, including a hidden one — NPC editors only."""
    game = get_object_or_404(Game, game_slug=game_slug)
    character = _get_character_or_404(game, character_id, npc=True)
    error_response = _check_character_edit(request, character)
    if error_response:
        return error_response
    response = character_photos(request, game, character_id, npc=True, check_hidden=False)
    response['X-Skip-Cache'] = 'true'
    return response
