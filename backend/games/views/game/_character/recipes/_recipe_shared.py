"""Factories building the parameterized PC/NPC character recipe views (issue #1447).

Modeled on `_possession_shared.py`. Output masking depends on the caller, not only on the
endpoint: plain variants always mask a hidden output item, while the restricted variants only
unmask it for callers with `GameEdit` (a PC's owning player still sees it masked).
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from .....models import Game
from .....serializers import (
    CharacterRecipeAllSerializer,
    CharacterRecipeDetailFullSerializer,
    CharacterRecipeDetailSerializer,
)
from ....common import check_game_edit
from ...recipes._character_recipes import character_recipe_detail, character_recipes
from .. import _build_api_view, _check_character_all_permission
from .._shared import _get_character_or_404, _hidden_gate_response


def _check_restricted_access(request, game, character_id, npc):
    """Return an error Response if the caller may not use a restricted recipe variant.

    On NPCs the hidden-NPC gate runs first (E7), so a hidden NPC is a `404` for anyone who
    cannot view it; then CharacterEdit (PCs) or GameEdit (NPCs) is required.
    """
    if npc:
        character = _get_character_or_404(game, character_id, npc=True)
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response
    return _check_character_all_permission(request, game, character_id, npc)


def _mask_hidden_output(request, game):
    """Return whether a hidden output item must be masked for this (authorized) caller."""
    return check_game_edit(request, game) is not None


def _skip_cache(response):
    """Mark `response` as never cacheable and return it."""
    response['X-Skip-Cache'] = 'true'
    return response


def build_recipes_view(npc):
    """Build the plain GET recipes view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of non-hidden recipes known by a PC/NPC, output masked."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_recipes(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_recipes_all_view(npc):
    """Build the restricted GET recipes/all.json view for a PC (CharacterEdit) or NPC (GameEdit)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return all recipes (including hidden) known by a PC/NPC, with `hidden`."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_restricted_access(request, game, character_id, npc)
        if error_response:
            return error_response
        return _skip_cache(character_recipes(
            request, game, character_id, npc=npc, check_hidden=npc, allow_hidden=True,
            serializer_class=CharacterRecipeAllSerializer,
            mask_hidden_output=_mask_hidden_output(request, game),
        ))

    return view


def build_recipe_detail_view(npc):
    """Build the plain GET recipe-detail view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, character_recipe_id):
        """Return a single non-hidden recipe known by a PC/NPC, output masked."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_recipe_detail(
            request, game, character_id, character_recipe_id, npc=npc, check_hidden=npc,
            serializer_class=CharacterRecipeDetailSerializer,
        )

    return view


def build_recipe_detail_full_view(npc):
    """Build the restricted GET recipe-detail-full view for a PC or NPC."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id, character_recipe_id):
        """Return any recipe (incl. hidden) known by a PC/NPC, with `hidden`."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_restricted_access(request, game, character_id, npc)
        if error_response:
            return error_response
        return _skip_cache(character_recipe_detail(
            request, game, character_id, character_recipe_id, npc=npc, check_hidden=npc,
            allow_hidden=True, serializer_class=CharacterRecipeDetailFullSerializer,
            mask_hidden_output=_mask_hidden_output(request, game),
        ))

    return view

