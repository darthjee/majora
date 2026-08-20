"""Shared implementation for the character possession available-list/acquire/remove endpoints."""

from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ....models import CharacterPossession
from ....serializers import CharacterPossessionAllSerializer
from ...common import paginated_list_response, validated_or_error
from ...games._treasure_filters import filter_by_name
from .._decorators import check_hidden
from .._shared import _character_possession_resource


def _check_possession_create(request, game, character, tier):
    """Return an error Response if `request.user` may not create/remove a possession at `tier`."""
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_possession_resource(character), tier, 'create',
    )


class _PossessionAcquireSerializer(serializers.Serializer):
    """Validate the game_possession_id/hidden payload for the acquire endpoints."""

    game_possession_id = serializers.IntegerField()
    hidden = serializers.BooleanField(required=False, default=None, allow_null=True)


class _PossessionRemoveSerializer(serializers.Serializer):
    """Validate the game_possession_id payload for the remove endpoints."""

    game_possession_id = serializers.IntegerField()


@check_hidden
def character_possessions_available(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=None,
):
    """Return a paginated GamePossession catalog, minus possessions `character` already owns.

    Mirrors `character_items_available` (`_item_exchange.py`)'s hidden-character gate and
    hidden-possession filtering, but queries `game.possessions` (the catalog) instead of
    `character.character_possessions` (owned rows), excluding any GamePossession id already
    linked to the character.
    """
    owned_ids = character.character_possessions.values_list('game_possession_id', flat=True)
    possessions = game.possessions.exclude(id__in=owned_ids)
    if not allow_hidden:
        possessions = possessions.exclude(hidden=True)
    possessions = filter_by_name(request, possessions)

    response = paginated_list_response(request, possessions, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_possession_acquire(request, game, character, check_hidden, allow_hidden=False):
    """Create a CharacterPossession linking `character` to a submitted GamePossession.

    `allow_hidden` bypasses the hidden-GamePossession 404 gate — reserved for the DM-only
    `/acquire/all.json` endpoints. Mirrors `character_document_acquire`'s `get_or_create`
    duplicate handling (422 on an already-owned possession), since `CharacterPossession`
    is `unique_together`'d like `CharacterDocument`, unlike `CharacterItem`. Also selects the
    permission tier: `restricted` (staff/owner) for `/acquire/all.json`, `regular`
    (staff/player) for the plain `/acquire.json`.
    """
    tier = 'restricted' if allow_hidden else 'regular'
    error_response = _check_possession_create(request, game, character, tier)
    if error_response:
        return error_response

    serializer = _PossessionAcquireSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game_possession = _find_game_possession(
        game, serializer.validated_data['game_possession_id'], allow_hidden,
    )
    hidden = serializer.validated_data['hidden']
    if hidden is None:
        hidden = game_possession.hidden

    character_possession, created = CharacterPossession.objects.get_or_create(
        character=character, game_possession=game_possession, defaults={'hidden': hidden},
    )
    if not created:
        return Response(
            {'errors': {'game_possession_id': ['game_possession_already_owned']}}, status=422,
        )

    return Response(CharacterPossessionAllSerializer(character_possession).data, status=201)


@check_hidden
def character_possession_remove(request, game, character, check_hidden, allow_hidden=False):
    """Delete the CharacterPossession linking `character` to a submitted GamePossession.

    `allow_hidden` bypasses the hidden-CharacterPossession 404 gate — reserved for the
    DM-only `/remove/all.json` endpoints. Also selects the permission tier: `restricted`
    (staff/owner) for `/remove/all.json`, `regular` (staff/player) for the plain
    `/remove.json`.
    """
    tier = 'restricted' if allow_hidden else 'regular'
    error_response = _check_possession_create(request, game, character, tier)
    if error_response:
        return error_response

    serializer = _PossessionRemoveSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character_possession = character.character_possessions.filter(
        game_possession_id=serializer.validated_data['game_possession_id'],
    ).first()
    if character_possession is None or (character_possession.hidden and not allow_hidden):
        raise Http404

    character_possession.delete()
    return Response(status=204)


def _find_game_possession(game, game_possession_id, allow_hidden):
    """Return the GamePossession matching `game_possession_id` scoped to `game`, or raise 404."""
    game_possession = game.possessions.filter(id=game_possession_id).first()
    if game_possession is None:
        raise Http404
    if not allow_hidden and game_possession.hidden:
        raise Http404
    return game_possession
