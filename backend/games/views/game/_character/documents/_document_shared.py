"""Factories building the parameterized PC/NPC document view pairs (issue #690).

Split out of `_character_shared.py` — see that module's docstring for the general rationale.
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from .....models import Game
from .....serializers import (
    CharacterDocumentSerializer,
    GameDocumentAllListSerializer,
    GameDocumentListSerializer,
)
from ....common import check_game_edit
from ...documents._document_exchange import (
    character_document_acquire,
    character_document_remove,
    character_documents_available,
)
from ...documents._document_files import character_document_files
from ...documents._document_photos import character_document_photos
from ...documents._documents import character_document_detail, character_documents
from .. import _build_api_view, _check_character_all_permission


def build_documents_view(npc):
    """Build the GET documents view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_items_view` above, minus the `POST` branch — there is no create endpoint
    for documents in this issue.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of non-hidden documents held by a PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_documents(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_documents_all_view(npc, serializer_class):
    """Build the DM/owner-only GET documents-all view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return all documents (including hidden) held by a PC/NPC — dm/owner/superuser only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_documents(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_document_detail_view(npc, serializer_class=CharacterDocumentSerializer):
    """Build the GET document-detail view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_item_detail_view` below, minus the `PATCH` branch — there is no update
    endpoint for documents (nothing left on `CharacterDocument` to edit).
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, document_id):
        """Return a single document held by a specific PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_document_detail(
            request, game, character_id, document_id, npc=npc, check_hidden=npc,
            serializer_class=serializer_class,
        )

    return view


def build_document_detail_full_view(npc, serializer_class):
    """Build the DM/owner-only GET document-detail-full view for a PC or NPC.

    Mirrors `build_item_detail_full_view` below, minus the `PATCH`/photo-upload wiring; reuses
    `_check_character_all_permission` for the same dm/admin(/owner) split `/documents/all.json`
    already applies.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, document_id):
        """Return detail for any document (incl. hidden) held by a PC/NPC — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_document_detail(
            request, game, character_id, document_id, npc=npc, check_hidden=npc,
            allow_hidden=True, serializer_class=serializer_class,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_document_files_view(npc):
    """Build the GET document files-list view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_documents_view` above, narrowed to a single document's underlying
    `GameDocument` files.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, document_id):
        """Return a paginated list of ready files for a document held by a specific PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_document_files(
            request, game, character_id, document_id, npc=npc, check_hidden=npc,
        )

    return view


def build_document_files_all_view(npc):
    """Build the DM/owner-only GET document files-list-all view for a PC or NPC.

    Mirrors `build_documents_all_view` above; reuses `_check_character_all_permission` for the
    same dm/admin(/owner) split `/documents/all.json` already applies.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, document_id):
        """Return all ready files for a document held by a PC/NPC — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_document_files(
            request, game, character_id, document_id, npc=npc, check_hidden=npc,
            allow_hidden=True,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_document_photos_view(npc):
    """Build the GET document photos-list view for a PC (`npc=False`) or NPC (`npc=True`).

    Mirrors `build_document_files_view` above, for the document's underlying photos instead.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, document_id):
        """Return a paginated list of ready photos for a document held by a specific PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_document_photos(
            request, game, character_id, document_id, npc=npc, check_hidden=npc,
        )

    return view


def build_document_photos_all_view(npc):
    """Build the DM/owner-only GET document photos-list-all view for a PC or NPC.

    Mirrors `build_document_files_all_view` above, for the document's underlying photos instead.
    """

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, document_id):
        """Return all ready photos for a document held by a PC/NPC — dm/owner/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        response = character_document_photos(
            request, game, character_id, document_id, npc=npc, check_hidden=npc,
            allow_hidden=True,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_documents_available_view(npc):
    """Build the GET documents/available.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the game's document catalog minus documents already owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_documents_available(
            request, game, character_id, npc=npc, check_hidden=npc,
            serializer_class=GameDocumentListSerializer,
        )

    return view


def build_documents_available_all_view(npc):
    """Build the DM-only GET documents/available/all.json view for a PC or NPC."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return the catalog (incl. hidden), minus already-owned documents — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        response = character_documents_available(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=GameDocumentAllListSerializer,
        )
        response['X-Skip-Cache'] = 'true'
        return response

    return view


def build_document_acquire_view(npc):
    """Build the POST documents/acquire.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterDocument for the PC/NPC from a submitted GameDocument."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_document_acquire(
            request, game, character_id, npc=npc, check_hidden=npc,
        )

    return view


def build_document_acquire_all_view(npc):
    """Build the DM-only POST documents/acquire/all.json view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterDocument, including from a hidden GameDocument — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        return character_document_acquire(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view


def build_document_remove_view(npc):
    """Build the POST documents/remove.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterDocument owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_document_remove(
            request, game, character_id, npc=npc, check_hidden=npc,
        )

    return view


def build_document_remove_all_view(npc):
    """Build the restricted POST documents/remove/all.json view for a PC or NPC.

    PC: dm/admin/owner (`game_pc`/`restricted`/`edit`). NPC: dm/admin (`game`/`restricted`/
    `edit`, no owner concept) — same asymmetric split `_check_character_all_permission`
    already applies to `items/remove/all.json`.
    """

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterDocument, including a hidden one — dm/admin(/owner for PCs) only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        return character_document_remove(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
        )

    return view
