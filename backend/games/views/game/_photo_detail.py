"""Shared implementation for the character photo detail (update-ready / delete) endpoints."""

from django.http import Http404
from rest_framework.response import Response

from ...permissions import EndpointPermission
from ._shared import _character_resource, _get_character_or_404


def character_photo_detail(request, game, character_id, photo_id, npc):
    """Update a character's photo `ready` status (PATCH), or delete it (DELETE)."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = EndpointPermission(request.user, game=character.game, pc=character).check(
        request, _character_resource(character), 'restricted', 'photo_delete',
    )
    if error_response:
        return error_response

    photo = character.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    if request.method == 'PATCH':
        return _update_ready(character, photo)
    return _delete(photo)


def _update_ready(character, photo):
    """Mark `photo` as not-ready, clearing it from `character`'s profile photo if set."""
    photo.ready = False
    photo.save()
    if character.profile_photo_id == photo.id:
        character.profile_photo = None
        character.save()
    response = Response(status=200)
    response['X-Skip-Cache'] = 'true'
    return response


def _delete(photo):
    """Permanently delete `photo`, or return 422 if it is still marked ready."""
    if photo.ready:
        response = Response(status=422)
        response['X-Skip-Cache'] = 'true'
        return response
    photo.delete()
    response = Response(status=204)
    response['X-Skip-Cache'] = 'true'
    return response
