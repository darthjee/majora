"""Shared implementation for the character possession-creation endpoint (issue #1076)."""

from django.db import transaction
from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ....models import CharacterPossession, GamePossession
from ....serializers import CharacterPossessionAllSerializer
from ...common import validated_or_error
from .._shared import _character_possession_resource


class _CharacterPossessionCreateSerializer(serializers.Serializer):
    """Validate the name/description/hidden payload for creating a character possession.

    Validation-only: not a `ModelSerializer` of either `GamePossession` or
    `CharacterPossession`, since a single request writes both rows at once from the same
    payload.
    """

    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def character_possession_create(request, game, character):
    """Create a new GamePossession for `game` and a linked CharacterPossession for `character`.

    The submitted `name`/`description` are written onto the new `GamePossession` only —
    there is no option to link an already-existing `GamePossession` (use the acquire
    endpoint for that).

    Uses `game_pc_possession`/`game_npc_possession`'s `create_update` action, borrowed
    unchanged from `game_pc_item`/`game_npc_item`'s player-facing creation tier: any player
    of the game, in addition to dm/admin/staff/owner-of-PC.
    """
    error_response = EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_possession_resource(character), 'regular', 'create_update',
    )
    if error_response:
        return error_response

    serializer = _CharacterPossessionCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character_possession = _create_possession(game, character, serializer.validated_data)
    return Response(CharacterPossessionAllSerializer(character_possession).data, status=201)


def _create_possession(game, character, validated_data):
    """Atomically create a GamePossession for `game` and a linked CharacterPossession.

    `GamePossession` receives the full `validated_data` (`name`, `description`, `hidden`);
    the new `CharacterPossession` only receives `hidden` plus its `character`/
    `game_possession` links.
    """
    with transaction.atomic():
        game_possession = GamePossession.objects.create(game=game, **validated_data)
        return CharacterPossession.objects.create(
            character=character, game_possession=game_possession,
            hidden=validated_data.get('hidden', False),
        )
