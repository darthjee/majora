"""Shared implementation for the character document available-list/acquire/remove endpoints."""

from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from permissions import EndpointPermission

from ...models import CharacterDocument
from ...serializers import CharacterDocumentAllSerializer
from ..common import paginated_list_response, validated_or_error
from ..games._treasure_filters import filter_by_name
from ._shared import _character_document_resource, _get_character_or_404, _hidden_gate_response


def _check_document_create(request, game, character, tier):
    """Return an error Response if `request.user` may not create/remove a document at `tier`."""
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_document_resource(character), tier, 'create',
    )


class _DocumentAcquireSerializer(serializers.Serializer):
    """Validate the game_document_id/hidden payload for the acquire endpoints."""

    game_document_id = serializers.IntegerField()
    hidden = serializers.BooleanField(required=False, default=None, allow_null=True)


class _DocumentRemoveSerializer(serializers.Serializer):
    """Validate the game_document_id payload for the remove endpoints."""

    game_document_id = serializers.IntegerField()


def character_documents_available(
    request, game, character_id, npc, check_hidden, allow_hidden=False,
    serializer_class=None,
):
    """Return a paginated GameDocument catalog, minus documents `character` already owns.

    Mirrors `character_items_available` (`_item_exchange.py`)'s hidden-character gate and
    hidden-document filtering, but queries `game.documents` (the catalog) instead of
    `character.character_documents` (owned rows), excluding any GameDocument id already
    linked to the character.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    owned_ids = character.character_documents.values_list('game_document_id', flat=True)
    documents = game.documents.exclude(id__in=owned_ids)
    if not allow_hidden:
        documents = documents.exclude(hidden=True)
    documents = filter_by_name(request, documents)

    response = paginated_list_response(request, documents, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def character_document_acquire(request, game, character, allow_hidden=False):
    """Create a CharacterDocument linking `character` to a submitted GameDocument.

    `allow_hidden` bypasses the hidden-GameDocument 404 gate — reserved for the DM-only
    `/acquire/all.json` endpoints, mirroring `character_item_acquire`'s `allow_hidden`. Also
    selects the permission tier: `restricted` (staff/owner) for `/acquire/all.json`, `regular`
    (staff/player) for the plain `/acquire.json`.
    """
    tier = 'restricted' if allow_hidden else 'regular'
    error_response = _check_document_create(request, game, character, tier)
    if error_response:
        return error_response

    serializer = _DocumentAcquireSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game_document = _find_game_document(
        game, serializer.validated_data['game_document_id'], allow_hidden,
    )
    hidden = serializer.validated_data['hidden']
    if hidden is None:
        hidden = game_document.hidden

    character_document, created = CharacterDocument.objects.get_or_create(
        character=character, game_document=game_document, defaults={'hidden': hidden},
    )
    if not created:
        return Response(
            {'errors': {'game_document_id': ['game_document_already_owned']}}, status=422,
        )

    return Response(CharacterDocumentAllSerializer(character_document).data, status=201)


def character_document_remove(request, game, character, allow_hidden=False):
    """Delete the CharacterDocument linking `character` to a submitted GameDocument.

    `allow_hidden` bypasses the hidden-CharacterDocument 404 gate — reserved for the DM-only
    `/remove/all.json` endpoints. Also selects the permission tier: `restricted` (staff/owner)
    for `/remove/all.json`, `regular` (staff/player) for the plain `/remove.json`.
    """
    tier = 'restricted' if allow_hidden else 'regular'
    error_response = _check_document_create(request, game, character, tier)
    if error_response:
        return error_response

    serializer = _DocumentRemoveSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character_document = character.character_documents.filter(
        game_document_id=serializer.validated_data['game_document_id'],
    ).first()
    if character_document is None or (character_document.hidden and not allow_hidden):
        raise Http404

    character_document.delete()
    return Response(status=204)


def _find_game_document(game, game_document_id, allow_hidden):
    """Return the GameDocument matching `game_document_id` scoped to `game`, or raise Http404."""
    game_document = game.documents.filter(id=game_document_id).first()
    if game_document is None:
        raise Http404
    if not allow_hidden and game_document.hidden:
        raise Http404
    return game_document
