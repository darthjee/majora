"""Shared implementation for the character photo set (role update) endpoints."""

from django.http import Http404
from rest_framework.response import Response

from permissions import EndpointPermission

from .._shared import _character_resource, _get_character_or_404


def character_photo_set(request, game, character_id, photo_id, npc):
    """Update roles on a character's photo (e.g. mark it as the profile photo)."""
    character = _get_character_or_404(game, character_id, npc)

    error_response = EndpointPermission(request.user, game=character.game, pc=character).check(
        request, _character_resource(character), 'regular', 'photo_upload',
    )
    if error_response:
        return error_response

    photo = character.photos.filter(id=photo_id).first()
    if photo is None:
        raise Http404

    _apply_roles(character, photo, request.data.get('roles') or [])

    return Response(status=200)


def _apply_roles(character, photo, roles):
    """Apply the requested roles to `photo`, mutating `character` as needed."""
    if 'profile' in roles:
        character.photo = photo
        character.save()
