"""Shared implementation for the character item-update endpoint (issue #766)."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response

from ...permissions import EndpointPermission
from ...serializers import CharacterItemDetailFullSerializer, CharacterItemUpdateSerializer
from ..common import validated_or_error
from ._shared import _character_item_resource, _hidden_gate_response


def character_item_update(request, character, item_id, npc):
    """Update the name/description/hidden fields of a CharacterItem held by `character`.

    Uses the `create_update` action (issue #864): dm/admin/staff/owner via
    `character.can_be_edited_by`, plus the global Staff bypass, plus any player of the game.
    NPC items get an extra hidden-visibility pre-check, mirroring
    `GET /games/:game_slug/npcs/:character_id`'s `_hidden_gate_response`: 404s before the
    permission check even runs when the NPC is hidden and the requester can't edit it — this
    is what makes `staff` lose access to a hidden NPC's items despite otherwise being allowed
    to edit them.
    """
    if npc:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    error_response = EndpointPermission(request.user, game=character.game, pc=character).check(
        request, _character_item_resource(character), 'regular', 'create_update',
    )
    if error_response:
        return error_response

    character_item = get_object_or_404(character.character_items, id=item_id)
    serializer = CharacterItemUpdateSerializer(character_item, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    return Response(CharacterItemDetailFullSerializer(character_item).data)
