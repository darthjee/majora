"""Shared implementation for the character photos-list endpoint."""

from ....serializers import CharacterPhotoSerializer
from ...common import paginated_list_response
from .._decorators import check_hidden


@check_hidden
def character_photos(request, game, character, check_hidden):
    """Return a paginated list of ready photos for a specific character in a game.

    When `check_hidden` is True, a hidden character is gated behind the requester's edit
    permission and the response carries `X-Skip-Cache` when the character is hidden; when
    False, neither behavior applies.
    """
    photos = character.photos.filter(ready=True)
    response = paginated_list_response(request, photos, CharacterPhotoSerializer)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response
