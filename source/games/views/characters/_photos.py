"""Shared implementation for the character photos-list endpoint."""

from ...serializers import CharacterPhotoSerializer
from ..common import paginated_list_response
from ._shared import _get_character_or_404, _hidden_gate_response


def character_photos(request, game, character_id, npc, check_hidden):
    """Return a paginated list of ready photos for a specific character in a game.

    When `check_hidden` is True, a hidden character is gated behind the requester's edit
    permission and the response carries `X-Skip-Cache` when the character is hidden; when
    False, neither behavior applies.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    photos = character.photos.filter(ready=True)
    response = paginated_list_response(request, photos, CharacterPhotoSerializer)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
