"""Factories building the parameterized PC/NPC possession view pairs (issue #690).

Split out of `_character_shared.py` — see that module's docstring for the general rationale.
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from .....models import Game
from .....serializers import (
    CharacterPossessionSerializer,
    GamePossessionAllListSerializer,
    GamePossessionListSerializer,
)
from ....common import check_game_edit
from .. import _build_api_view, _check_character_all_permission
from .._shared import _get_character_or_404, _hidden_gate_response
from ...possessions._possession_create import character_possession_create
from ...possessions._possession_exchange import (
    character_possession_acquire,
    character_possession_remove,
    character_possessions_available,
)
from ...possessions._possessions import character_possession_detail, character_possessions


def build_possessions_view(npc):
    """Build the GET/POST possessions view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_items_view` above, including its NPC hidden-gate check on the `POST`
    branch (issue #864 follow-up, borrowed by #1076): without it, the `create_update` action
    would let any player of the game create a possession on a hidden NPC, confirming that
    NPC's existence via the response.
    """

    @_build_api_view(['GET', 'POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of non-hidden possessions, or create one, for a PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        if request.method == 'POST':
            character = _get_character_or_404(game, character_id, npc=npc)
            if npc:
                error_response = _hidden_gate_response(character, request)
                if error_response:
                    return error_response
            return character_possession_create(request, game, character)
        return character_possessions(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_possessions_all_view(npc, serializer_class):
    """Build the DM/owner-only GET possessions-all view for a PC or NPC."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return all possessions (including hidden) held by a PC/NPC — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_possessions(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_possession_detail_view(npc, serializer_class=CharacterPossessionSerializer):
    """Build the GET possession-detail view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_document_detail_view` above — no `PATCH` branch, since there is nothing
    left on `CharacterPossession` to edit (edits go straight to `GamePossession`).
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, possession_id):
        """Return a single possession held by a specific PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_possession_detail(
            request, game, character_id, possession_id, npc=npc, check_hidden=npc,
            serializer_class=serializer_class,
        )

    return view


def build_possession_detail_full_view(npc, serializer_class):
    """Build the DM/owner-only GET possession-detail-full view for a PC or NPC.

    Mirrors `build_document_detail_full_view` above; reuses `_check_character_all_permission`
    for the same dm/admin(/owner) split `/possessions/all.json` already applies.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, possession_id):
        """Return detail for any possession (incl. hidden) held by a PC/NPC — dm/owner/admin."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_possession_detail(
            request, game, character_id, possession_id, npc=npc, check_hidden=npc,
            allow_hidden=True, serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_possessions_available_view(npc):
    """Build the GET possessions/available.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the game's possession catalog minus possessions already owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_possessions_available(
            request, game, character_id, npc=npc, check_hidden=npc,
            serializer_class=GamePossessionListSerializer,
        )

    return view


def build_possessions_available_all_view(npc):
    """Build the DM-only GET possessions/available/all.json view for a PC or NPC."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the catalog (incl. hidden), minus already-owned possessions — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        response = character_possessions_available(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=GamePossessionAllListSerializer,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_possession_acquire_view(npc):
    """Build the POST possessions/acquire.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterPossession for the PC/NPC from a submitted GamePossession."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_possession_acquire(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_possession_acquire_all_view(npc):
    """Build the DM-only POST possessions/acquire/all.json view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterPossession, including from a hidden GamePossession — DM only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        return character_possession_acquire(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view


def build_possession_remove_view(npc):
    """Build the POST possessions/remove.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterPossession owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_possession_remove(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_possession_remove_all_view(npc):
    """Build the restricted POST possessions/remove/all.json view for a PC or NPC.

    PC: dm/admin/owner (`game_pc`/`restricted`/`create`). NPC: dm/admin (`game`/`restricted`/
    `edit`, no owner concept) — same asymmetric split `_check_character_all_permission`
    already applies to `items/remove/all.json`/`documents/remove/all.json`.
    """

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterPossession, including a hidden one — dm/admin(/owner for PCs)."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        return character_possession_remove(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view
