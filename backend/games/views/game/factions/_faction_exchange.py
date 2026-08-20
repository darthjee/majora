"""Shared implementation for the character faction available-list/acquire/remove endpoints."""

from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ....models import CharacterFaction
from ....serializers import CharacterFactionAllSerializer
from ...common import paginated_list_response, validated_or_error
from ...games._treasure_filters import filter_by_name
from .._decorators import check_hidden
from .._shared import _character_faction_resource


def _check_faction_create(request, game, character, tier):
    """Return an error Response if `request.user` may not create/remove a faction at `tier`."""
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_faction_resource(character), tier, 'create',
    )


class _FactionAcquireSerializer(serializers.Serializer):
    """Validate the game_faction_id/hidden payload for the acquire endpoints."""

    game_faction_id = serializers.IntegerField()
    hidden = serializers.BooleanField(required=False, default=None, allow_null=True)


@check_hidden
def character_factions_available(
    request, game, character, check_hidden, allow_hidden=False,
    serializer_class=None,
):
    """Return a paginated GameFaction catalog, minus factions `character` already belongs to.

    Mirrors `character_documents_available` (`_document_exchange.py`)'s hidden-character gate,
    but queries `game.factions` (the catalog) instead of `character.character_factions`
    (owned rows), excluding any GameFaction id already linked to the character. `GameFaction`
    has no `hidden` concept of its own, so there's no catalog-side hidden filtering to apply
    here (unlike documents) — `allow_hidden` only ever affects the hidden-character gate.
    """
    enlisted_ids = character.character_factions.values_list('game_faction_id', flat=True)
    factions = game.factions.exclude(id__in=enlisted_ids)
    factions = filter_by_name(request, factions)

    response = paginated_list_response(request, factions, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


@check_hidden
def character_faction_acquire(request, game, character, check_hidden, allow_hidden=False):
    """Create a CharacterFaction linking `character` to a submitted GameFaction.

    `allow_hidden` bypasses the hidden-character 404 gate — reserved for the DM-only
    `/acquire/all.json` endpoints, mirroring `character_document_acquire`'s `allow_hidden`.
    Also selects the permission tier: `restricted` (staff/owner) for `/acquire/all.json`,
    `regular` (staff/player) for the plain `/acquire.json`.
    """
    tier = 'restricted' if allow_hidden else 'regular'
    error_response = _check_faction_create(request, game, character, tier)
    if error_response:
        return error_response

    serializer = _FactionAcquireSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game_faction = _find_game_faction(game, serializer.validated_data['game_faction_id'])
    hidden = serializer.validated_data['hidden']
    if hidden is None:
        hidden = False

    character_faction, created = CharacterFaction.objects.get_or_create(
        character=character, game_faction=game_faction, defaults={'hidden': hidden},
    )
    if not created:
        return Response(
            {'errors': {'game_faction_id': ['game_faction_already_enlisted']}}, status=422,
        )

    return Response(CharacterFactionAllSerializer(character_faction).data, status=201)


@check_hidden
def character_faction_remove(
    request, game, character, faction_id, check_hidden, allow_hidden=False,
):
    """Delete the CharacterFaction linking `character` to the `faction_id` in the URL.

    `allow_hidden` bypasses the hidden-CharacterFaction 404 gate — reserved for the DM-only
    `/remove/all.json` endpoints. Also selects the permission tier: `restricted` (staff/owner)
    for `/remove/all.json`, `regular` (staff/player) for the plain `/remove.json`.
    """
    tier = 'restricted' if allow_hidden else 'regular'
    error_response = _check_faction_create(request, game, character, tier)
    if error_response:
        return error_response

    character_faction = character.character_factions.filter(game_faction_id=faction_id).first()
    if character_faction is None or (character_faction.hidden and not allow_hidden):
        raise Http404

    character_faction.delete()
    return Response(status=204)


def _find_game_faction(game, game_faction_id):
    """Return the GameFaction matching `game_faction_id` scoped to `game`, or raise Http404.

    `GameFaction` has no `hidden` field (out of scope for this issue), so unlike
    `_find_game_document`'s equivalent, there's no hidden-gate branch to apply here.
    """
    game_faction = game.factions.filter(id=game_faction_id).first()
    if game_faction is None:
        raise Http404
    return game_faction
