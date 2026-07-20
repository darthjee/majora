"""Shared implementation for the character item-creation endpoint (issue #714)."""

from django.db import transaction
from rest_framework import serializers
from rest_framework.response import Response

from ...models import CharacterItem, GameItem
from ...permissions import CharacterItemCreatePermission
from ...serializers import CharacterItemDetailAllSerializer
from ..common import validated_or_error


class _CharacterItemCreateSerializer(serializers.Serializer):
    """Validate the name/description/hidden payload for creating a character item.

    Validation-only: not a `ModelSerializer` of either `GameItem` or `CharacterItem`, since a
    single request writes both rows at once with the same values.
    """

    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default='', allow_blank=True)
    hidden = serializers.BooleanField(required=False, default=False)


def character_item_create(request, game, character):
    """Create a new GameItem for `game` and a linked CharacterItem belonging to `character`.

    The submitted `name`/`description`/`hidden` are duplicated verbatim onto both rows, per
    the confirmed issue behavior — there is no option to link an already-existing `GameItem`.
    """
    error_response = CharacterItemCreatePermission.check(request, character)
    if error_response:
        return error_response

    serializer = _CharacterItemCreateSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character_item = _create_item(game, character, serializer.validated_data)
    return Response(CharacterItemDetailAllSerializer(character_item).data, status=201)


def _create_item(game, character, validated_data):
    """Atomically create a GameItem for `game` and the linked CharacterItem for `character`."""
    with transaction.atomic():
        game_item = GameItem.objects.create(game=game, **validated_data)
        return CharacterItem.objects.create(
            character=character, game_item=game_item, **validated_data
        )
