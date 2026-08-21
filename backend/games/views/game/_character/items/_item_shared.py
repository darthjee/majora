"""Factories building the parameterized PC/NPC item view pairs (issue #690).

Split out of `_character_shared.py` — see that module's docstring for the general rationale.
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated

from .....models import Game
from .....serializers import (
    CharacterItemDetailSerializer,
    GameItemAllListSerializer,
    GameItemListSerializer,
)
from ....common import check_game_edit
from .. import _build_api_view, _check_character_all_permission
from .._shared import _get_character_or_404, _hidden_gate_response
from ...items._item_create import character_item_create
from ...items._item_exchange import (
    character_item_acquire,
    character_item_remove,
    character_items_available,
)
from ...items._item_photo_upload import character_item_photo_upload
from ...items._item_update import character_item_update
from ...items._items import character_item_detail, character_items


def build_items_view(npc):
    """Build the GET/POST items view for a PC (`npc=False`) or NPC (`npc=True`).

    The `POST` branch applies the same `_hidden_gate_response` pre-check as
    `character_item_update` (issue #864 follow-up): without it,
    the `create_update` action would let any player of the game create an item on a
    hidden NPC, confirming that NPC's existence via the response.
    """

    @_build_api_view(['GET', 'POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of non-hidden items, or create a new item, for a PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        if request.method == 'POST':
            character = _get_character_or_404(game, character_id, npc=npc)
            if npc:
                error_response = _hidden_gate_response(character, request)
                if error_response:
                    return error_response
            return character_item_create(request, game, character)
        return character_items(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_items_all_view(npc, serializer_class):
    """Build the DM/owner-only GET items-all view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return all items (including hidden) held by a PC/NPC — dm/owner/superuser only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_items(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_item_detail_view(npc, serializer_class=CharacterItemDetailSerializer):
    """Build the GET/PATCH item-detail view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET', 'PATCH'], AllowAny)
    def view(request, game_slug, character_id, item_id):
        """Return, or update, a single item held by a specific PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        if request.method == 'PATCH':
            character = _get_character_or_404(game, character_id, npc=npc)
            return character_item_update(request, character, item_id, npc=npc)
        return character_item_detail(
            request, game, character_id, item_id, npc=npc, check_hidden=npc,
            serializer_class=serializer_class,
        )

    return view


def build_item_detail_full_view(npc, serializer_class):
    """Build the DM/owner-only GET item-detail-full view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, item_id):
        """Return detail for any item (including hidden) held by a PC/NPC — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_item_detail(
            request, game, character_id, item_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_item_photo_upload_view(npc):
    """Build the POST item photo-upload-init view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], IsAuthenticated)
    def view(request, game_slug, character_id, item_id):
        """Initialise a PC/NPC item photo upload and return the upload id and token."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_item_photo_upload(
            request, game, game_slug, character_id, item_id, npc=npc,
        )

    return view


def build_items_available_view(npc):
    """Build the GET items/available.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the game's item catalog minus items already owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_items_available(
            request, game, character_id, npc=npc, check_hidden=npc,
            serializer_class=GameItemListSerializer,
        )

    return view


def build_items_available_all_view(npc):
    """Build the DM-only GET items/available/all.json view for a PC or NPC."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the catalog (incl. hidden), minus already-owned items — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        response = character_items_available(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=GameItemAllListSerializer,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_item_acquire_view(npc):
    """Build the POST items/acquire.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterItem for the PC/NPC from a submitted GameItem."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_item_acquire(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_item_acquire_all_view(npc):
    """Build the DM-only POST items/acquire/all.json view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterItem, including from a hidden GameItem — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        return character_item_acquire(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view


def build_item_remove_view(npc):
    """Build the POST items/remove.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterItem owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_item_remove(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_item_remove_all_view(npc):
    """Build the restricted POST items/remove/all.json view for a PC or NPC.

    PC: dm/admin/owner (`game_pc`/`restricted`/`edit`). NPC: dm/admin (`game`/`restricted`/
    `edit`, no owner concept) — same asymmetric split `_check_character_all_permission`
    already applies to `items/all.json`/`documents/all.json`.
    """

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterItem, including a hidden one — dm/admin(/owner for PCs) only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        return character_item_remove(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view
