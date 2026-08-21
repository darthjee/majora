"""Factories building the parameterized PC/NPC treasure view pairs (issue #690).

Split out of `_character_shared.py` — see that module's docstring for the general rationale.

Note: treasure `all.json` views use `check_game_edit` directly (not
`_check_character_all_permission`) — the treasure domain lacks the PC/NPC owner asymmetry the
other domains have, and that is pre-existing behaviour this refactor preserves as-is.
"""

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from .....models import Game
from ....common import check_game_edit
from ...treasures._treasure_exchange import (
    character_treasure_acquire,
    character_treasure_buy,
    character_treasure_remove,
    character_treasure_sell,
)
from ...treasures._treasures import character_treasures
from .. import _build_api_view
from .._shared import _get_character_or_404


def build_treasures_view(npc):
    """Build the GET treasures-list view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of treasures held by a specific PC/NPC in a game."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_treasures(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_treasure_buy_view(npc):
    """Build the POST treasure-buy view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Spend a PC's/NPC's money to buy a quantity of a treasure available in a game."""
        game = get_object_or_404(Game, game_slug=game_slug)
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_treasure_buy(request, game, character)

    return view


def build_treasure_buy_all_view(npc):
    """Build the DM-only POST treasure-buy-all view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Spend a PC's/NPC's money to buy a treasure, including hidden ones — DM only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_treasure_buy(request, game, character, allow_hidden=True)

    return view


def build_treasure_sell_view(npc):
    """Build the POST treasure-sell view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Sell a quantity of a treasure owned by a PC/NPC, refunding its value into money."""
        game = get_object_or_404(Game, game_slug=game_slug)
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_treasure_sell(request, game, character)

    return view


def build_treasure_acquire_view(npc):
    """Build the POST treasure-acquire view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Add a quantity of a treasure available in a game to a PC/NPC, without touching money."""
        game = get_object_or_404(Game, game_slug=game_slug)
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_treasure_acquire(request, game, character)

    return view


def build_treasure_acquire_all_view(npc):
    """Build the DM-only POST treasure-acquire-all view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Add a treasure, including hidden ones, to a PC/NPC without touching money — DM only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = check_game_edit(request, game)
        if error_response:
            return error_response
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_treasure_acquire(request, game, character, allow_hidden=True)

    return view


def build_treasure_remove_view(npc):
    """Build the POST treasure-remove view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a quantity of a treasure owned by a PC/NPC, without touching money."""
        game = get_object_or_404(Game, game_slug=game_slug)
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_treasure_remove(request, game, character)

    return view
