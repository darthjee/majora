"""Factories building the parameterized PC/NPC faction view pairs (issue #690).

Split out of `_character_shared.py` — see that module's docstring for the general rationale.
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from .....models import Game
from .....serializers import CharacterFactionSerializer, GameFactionListSerializer
from ....common import check_game_edit
from ...factions._faction_exchange import (
    character_faction_acquire,
    character_faction_remove,
    character_factions_available,
)
from ...factions._factions import character_faction_detail, character_factions
from .. import _build_api_view, _check_character_all_permission


def build_factions_view(npc):
    """Build the GET factions view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_documents_view` above — no `POST` branch, `CharacterFaction` rows only ever
    come from acquire.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of non-hidden factions a PC/NPC belongs to."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_factions(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_factions_all_view(npc, serializer_class):
    """Build the DM/owner-only GET factions-all view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return all factions (including hidden) a PC/NPC belongs to — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_factions(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_faction_detail_view(npc, serializer_class=CharacterFactionSerializer):
    """Build the GET faction-detail view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_document_detail_view` above — no `PATCH` branch, there is nothing left on
    `CharacterFaction` to edit.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, faction_id):
        """Return a single faction membership held by a specific PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_faction_detail(
            request, game, character_id, faction_id, npc=npc, check_hidden=npc,
            serializer_class=serializer_class,
        )

    return view


def build_faction_detail_full_view(npc, serializer_class):
    """Build the DM/owner-only GET faction-detail-full view for a PC or NPC.

    Mirrors `build_document_detail_full_view` above; reuses `_check_character_all_permission`
    for the same dm/admin(/owner) split `/factions/all.json` already applies.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, faction_id):
        """Return detail for any faction (incl. hidden) held by a PC/NPC — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_faction_detail(
            request, game, character_id, faction_id, npc=npc, check_hidden=npc,
            allow_hidden=True, serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_factions_available_view(npc):
    """Build the GET factions/available.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the game's faction catalog minus factions the PC/NPC already belongs to."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_factions_available(
            request, game, character_id, npc=npc, check_hidden=npc,
            serializer_class=GameFactionListSerializer,
        )

    return view


def build_factions_available_all_view(npc):
    """Build the DM-only GET factions/available/all.json view for a PC or NPC."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the faction catalog, minus already-enlisted factions — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        response = character_factions_available(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=GameFactionListSerializer,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_faction_acquire_view(npc):
    """Build the POST factions/acquire.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterFaction for the PC/NPC from a submitted GameFaction."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_faction_acquire(
            request, game, character_id, npc=npc, check_hidden=npc,
        )

    return view


def build_faction_acquire_all_view(npc):
    """Build the DM-only POST factions/acquire/all.json view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterFaction, bypassing the hidden-character gate — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        return character_faction_acquire(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view


def build_faction_remove_view(npc):
    """Build the POST factions/<faction_id>/remove.json view for a PC (npc=False) or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id, faction_id):
        """Remove a CharacterFaction membership held by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_faction_remove(
            request, game, character_id, faction_id, npc=npc, check_hidden=npc,
        )

    return view


def build_faction_remove_all_view(npc):
    """Build the restricted POST factions/<faction_id>/remove/all.json view for a PC or NPC.

    PC: dm/admin/owner (`game_pc`/`restricted`/`edit`). NPC: dm/admin (`game`/`restricted`/
    `edit`, no owner concept) — same asymmetric split `_check_character_all_permission`
    already applies to `items/remove/all.json`/`documents/remove/all.json`.
    """

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id, faction_id):
        """Remove a CharacterFaction, including a hidden one — dm/admin(/owner for PCs) only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        return character_faction_remove(
            request, game, character_id, faction_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view
