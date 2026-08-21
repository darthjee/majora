"""Shared implementation for the character photo deletable-check endpoint."""

from django.http import Http404
from rest_framework.response import Response

from permissions import EndpointPermission

from .._character._shared import _character_resource, _get_character_or_404


def character_photo_deletable(request, game, character_id, photo_id, npc):
    """Return whether a character's photo is currently deletable, plus its file path."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = EndpointPermission(request.user, game=character.game, pc=character).check(
        request, _character_resource(character), 'restricted', 'photo_delete',
    )
    if error_response:
        return error_response

    photo = character.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    status = 422 if photo.ready else 200
    body = {'deletable': not photo.ready, 'path': photo.path} if status == 200 else None
    response = Response(body, status=status)
    response['X-Skip-Cache'] = 'true'
    return response
