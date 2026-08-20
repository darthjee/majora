"""Shared implementation for the character item available-list/acquire/remove endpoints."""

from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ....models import CharacterItem
from ....serializers import CharacterItemDetailFullSerializer
from ...common import paginated_list_response, validated_or_error
from ...games._treasure_filters import filter_by_name
from .._decorators import check_hidden
from .._shared import _character_item_resource


def _check_item_create(request, game, character):
    """Return an error Response if `request.user` may not create/remove an item, else None."""
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_item_resource(character), 'restricted', 'create',
    )


class _ItemAcquireSerializer(serializers.Serializer):
    """Validate the game_item_id/hidden payload for the acquire endpoints."""

    game_item_id = serializers.IntegerField()
    hidden = serializers.BooleanField(required=False, default=None, allow_null=True)


class _ItemRemoveSerializer(serializers.Serializer):
    """Validate the game_item_id payload for the remove endpoints."""

    game_item_id = serializers.IntegerField()


@check_hidden
def character_items_available(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=None,
):
    """Return a paginated GameItem catalog, minus items `character` already owns.

    Mirrors `character_items` (`_items.py`)'s hidden-character gate and hidden-item
    filtering, but queries `game.items` (the catalog) instead of `character.character_items`
    (owned rows), excluding any GameItem id already linked to the character.
    """
    owned_ids = character.character_items.values_list('game_item_id', flat=True)
    items = game.items.exclude(id__in=owned_ids)
    if not allow_hidden:
        items = items.exclude(hidden=True)
    items = filter_by_name(request, items)

    response = paginated_list_response(request, items, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_item_acquire(request, game, character, check_hidden, allow_hidden=False):
    """Create a CharacterItem linking `character` to a submitted GameItem.

    `allow_hidden` bypasses the hidden-GameItem 404 gate — reserved for the DM-only
    `/acquire/all.json` endpoints, mirroring `character_treasure_acquire`'s `allow_hidden`.
    """
    error_response = _check_item_create(request, game, character)
    if error_response:
        return error_response

    serializer = _ItemAcquireSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game_item = _find_game_item(game, serializer.validated_data['game_item_id'], allow_hidden)
    hidden = serializer.validated_data['hidden']
    if hidden is None:
        hidden = game_item.hidden

    character_item = CharacterItem.objects.create(
        character=character, game_item=game_item, hidden=hidden,
    )

    return Response(CharacterItemDetailFullSerializer(character_item).data, status=201)


@check_hidden
def character_item_remove(request, game, character, check_hidden, allow_hidden=False):
    """Delete the CharacterItem linking `character` to a submitted GameItem.

    `allow_hidden` bypasses the hidden-CharacterItem 404 gate — reserved for the DM-only
    `/remove/all.json` endpoints.
    """
    error_response = _check_item_create(request, game, character)
    if error_response:
        return error_response

    serializer = _ItemRemoveSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character_item = character.character_items.filter(
        game_item_id=serializer.validated_data['game_item_id'],
    ).first()
    if character_item is None or (character_item.hidden and not allow_hidden):
        raise Http404

    character_item.delete()
    return Response(status=204)


def _find_game_item(game, game_item_id, allow_hidden):
    """Return the GameItem matching `game_item_id` scoped to `game`, or raise Http404."""
    game_item = game.items.filter(id=game_item_id).first()
    if game_item is None:
        raise Http404
    if not allow_hidden and game_item.hidden:
        raise Http404
    return game_item
