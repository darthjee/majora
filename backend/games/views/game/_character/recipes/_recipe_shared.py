"""Factories building the parameterized PC/NPC character recipe views (issue #1447).

Modeled on `_possession_shared.py`. Output masking depends on the caller, not only on the
endpoint: plain variants always mask a hidden output item, while the restricted variants only
unmask it for callers with `GameEdit` (a PC's owning player still sees it masked).
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from permissions import EndpointPermission

from .....decorators import skip_cache
from .....models import Game
from .....serializers import (
    CharacterRecipeAllSerializer,
    CharacterRecipeDetailFullSerializer,
    CharacterRecipeDetailSerializer,
    GameRecipeAllListSerializer,
    GameRecipeListSerializer,
)
from ....common import check_game_edit
from ...recipes._character_recipes import (
    character_recipe_detail,
    character_recipe_update,
    character_recipes,
)
from ...recipes._recipe_exchange import (
    character_recipe_acquire,
    character_recipe_remove,
    character_recipes_available,
)
from .. import _build_api_view, _check_character_all_permission
from .._shared import (
    _character_recipe_resource,
    _get_character_or_404,
    _hidden_gate_response,
)


def _check_npc_hidden_gate(request, game, character_id, npc):
    """Return a `404` Response for a hidden NPC the caller cannot view (E7), else None.

    A no-op on PCs. Always resolves the character first, so an unknown id is a `404` too.
    """
    character = _get_character_or_404(game, character_id, npc=npc)
    return _hidden_gate_response(character, request) if npc else None


def _check_restricted_access(request, game, character_id, npc):
    """Return an error Response if the caller may not use a restricted recipe variant.

    On NPCs the hidden-NPC gate runs first (E7), so a hidden NPC is a `404` for anyone who
    cannot view it; then CharacterEdit (PCs) or GameEdit (NPCs) is required.
    """
    error_response = _check_npc_hidden_gate(request, game, character_id, npc)
    if error_response:
        return error_response
    return _check_character_all_permission(request, game, character_id, npc)


def _check_game_edit_access(request, game, character_id, npc):
    """Return an error Response if the caller may not use a catalog-level `/all` variant.

    Runs the hidden-NPC gate first on NPCs (E7), then requires GameEdit (no owner leniency).
    """
    error_response = _check_npc_hidden_gate(request, game, character_id, npc)
    if error_response:
        return error_response
    return check_game_edit(request, game)


def _check_exchange_access(request, game, character_id, npc):
    """Return an error Response if the caller may not use a plain available/acquire/remove.

    Runs the hidden-NPC gate first on NPCs (E7), then `regular.create` on
    `game_pc_recipe` / `game_npc_recipe` (staff, player).
    """
    error_response = _check_npc_hidden_gate(request, game, character_id, npc)
    if error_response:
        return error_response
    character = _get_character_or_404(game, character_id, npc=npc)
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_recipe_resource(character), 'regular', 'create',
    )


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


@skip_cache
def _patch_recipe(request, game, character_id, character_recipe_id, npc):
    """Toggle `hidden` on a character recipe row: gate, then permission, then row lookup."""
    error_response = _check_restricted_access(request, game, character_id, npc)
    if error_response:
        return error_response
    character = _get_character_or_404(game, character_id, npc=npc)
    return character_recipe_update(
        request, character, character_recipe_id,
        mask_hidden_output=_mask_hidden_output(request, game),
    )


def build_recipe_detail_view(npc):
    """Build the GET/PATCH recipe-detail view for a PC (`npc=False`) or NPC (`npc=True`).

    GET is the plain detail. PATCH toggles `hidden` only, for CharacterEdit (PCs) or GameEdit
    (NPCs) callers, and responds with the `/full.json` shape.
    """

    @_build_api_view(['GET', 'PATCH'], AllowAny)
    def view(request, game_slug, character_id, character_recipe_id):
        """Return a single non-hidden recipe known by a PC/NPC, or toggle its `hidden` flag."""
        game = get_object_or_404(Game, game_slug=game_slug)
        if request.method == 'PATCH':
            return _patch_recipe(request, game, character_id, character_recipe_id, npc)
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



def _build_gated_view(method, npc, check_access, exchange, **exchange_kwargs):
    """Build a never-cached `method` view: `check_access` first, then `exchange`.

    `exchange` is one of the `_recipe_exchange` functions, called with `exchange_kwargs`.
    """

    @skip_cache
    @_build_api_view([method], AllowAny)
    def view(request, game_slug, character_id):
        """Gate the caller for this PC/NPC recipe exchange endpoint, then run it."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_access(request, game, character_id, npc)
        if error_response:
            return error_response
        return exchange(
            request, game, character_id, npc=npc, check_hidden=npc, **exchange_kwargs,
        )

    return view


def build_recipes_available_view(npc):
    """Build the `regular.create` GET recipes/available.json view for a PC or NPC."""
    return _build_gated_view(
        'GET', npc, _check_exchange_access, character_recipes_available,
        serializer_class=GameRecipeListSerializer,
    )


def build_recipes_available_all_view(npc):
    """Build the GameEdit GET recipes/available/all.json view for a PC or NPC."""
    return _build_gated_view(
        'GET', npc, _check_game_edit_access, character_recipes_available,
        allow_hidden=True, serializer_class=GameRecipeAllListSerializer,
    )


def build_recipe_acquire_view(npc):
    """Build the `regular.create` POST recipes/acquire.json view (plain detail shape)."""
    return _build_gated_view(
        'POST', npc, _check_exchange_access, character_recipe_acquire,
        serializer_class=CharacterRecipeDetailSerializer, mask_hidden_output=True,
    )


def build_recipe_acquire_all_view(npc):
    """Build the GameEdit POST recipes/acquire/all.json view (`/full.json` shape, unmasked)."""
    return _build_gated_view(
        'POST', npc, _check_game_edit_access, character_recipe_acquire,
        allow_hidden=True, serializer_class=CharacterRecipeDetailFullSerializer,
        mask_hidden_output=False,
    )


def build_recipe_remove_view(npc):
    """Build the `regular.create` POST recipes/remove.json view for a PC or NPC."""
    return _build_gated_view(
        'POST', npc, _check_exchange_access, character_recipe_remove,
    )


def build_recipe_remove_all_view(npc):
    """Build the POST recipes/remove/all.json view (CharacterEdit for PCs, GameEdit for NPCs)."""
    return _build_gated_view(
        'POST', npc, _check_restricted_access, character_recipe_remove, allow_hidden=True,
    )
