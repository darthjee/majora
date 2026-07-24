"""Factories building the parameterized PC/NPC view pairs (issue #690).

Every PC/NPC endpoint pair under `game/pcs/` and `game/npcs/` differs only by the `npc`
flag, and occasionally by a serializer/permission class — the actual endpoint logic already
lives in the `npc`-parameterized shared modules (`_detail.py`, `_full.py`, `_items.py`, etc).
These factories collapse the remaining decorator/`get_object_or_404` boilerplate into a
single, `npc`-parameterized definition per endpoint shape, so the PC/NPC view modules become
thin one-line wrappers.
"""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from accounts.authentication import CookieTokenAuthentication

from ...models import Game
from ...permissions import CharacterEditPermission, GameEditPermission
from ...serializers import (
    CharacterItemDetailSerializer,
    CharacterPermissionsSerializer,
    GameItemAllListSerializer,
    GameItemListSerializer,
)
from ..common import access_response, parse_role_booleans, permissions_response
from ._documents import character_documents
from ._full import character_full
from ._item_create import character_item_create
from ._item_exchange import (
    character_item_acquire,
    character_item_remove,
    character_items_available,
)
from ._item_photo_upload import character_item_photo_upload
from ._item_update import character_item_update
from ._items import character_item_detail, character_items
from ._money import character_money_update
from ._photo_set import character_photo_set
from ._photo_upload import character_photo_upload
from ._photos import character_photos
from ._shared import _find_character, _get_character_or_404
from ._treasure_exchange import (
    character_treasure_acquire,
    character_treasure_buy,
    character_treasure_remove,
    character_treasure_sell,
)
from ._treasures import character_treasures


def _build_api_view(methods, permission_class):
    """Return a decorator applying this app's standard trio of DRF view decorators."""

    def decorator(view):
        view = permission_classes([permission_class])(view)
        view = authentication_classes([CookieTokenAuthentication])(view)
        return api_view(methods)(view)

    return decorator


def build_access_view(npc, access_serializer_class):
    """Build the GET access-check view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return whether the requesting user may edit a specific PC/NPC."""
        game = Game.objects.filter(game_slug=game_slug).first()
        character = _find_character(game, character_id, npc=npc)
        return access_response(
            access_serializer_class, character, request, context_extra={'game': game}
        )

    return view


def build_permissions_view(npc):
    """Build the GET permissions-check view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return whether the requester (real or role-simulated) may edit a specific PC/NPC."""
        game = Game.objects.filter(game_slug=game_slug).first()
        character = _find_character(game, character_id, npc=npc)
        role_booleans = parse_role_booleans(request)
        return permissions_response(
            CharacterPermissionsSerializer, character, request, role_booleans,
        )

    return view


def build_full_view(npc):
    """Build the GET/PATCH full-detail view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET', 'PATCH'], AllowAny)
    def view(request, game_slug, character_id):
        """Return or update full detail (including private description) for a PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_full(request, game, character_id, npc=npc)

    return view


def build_money_view(npc):
    """Build the PUT money-only update view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['PUT'], AllowAny)
    def view(request, game_slug, character_id):
        """Update a PC's/NPC's money through the narrow money-only endpoint."""
        game = get_object_or_404(Game, game_slug=game_slug)
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_money_update(request, character)

    return view


def build_photo_upload_view(npc):
    """Build the POST photo-upload-init view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['POST'], IsAuthenticated)
    def view(request, game_slug, character_id):
        """Initialise a PC/NPC photo upload and return the upload id and token."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_upload(request, game, game_slug, character_id, npc=npc)

    return view


def build_photo_set_view(npc):
    """Build the PATCH photo role-set view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['PATCH'], IsAuthenticated)
    def view(request, game_slug, character_id, photo_id):
        """Update roles (e.g. profile) on a PC's/NPC's photo."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photo_set(request, game, character_id, photo_id, npc=npc)

    return view


def build_photos_view(npc):
    """Build the GET photos-list view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of ready photos for a specific PC/NPC in a game."""
        game = get_object_or_404(Game, game_slug=game_slug)
        return character_photos(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def build_items_view(npc):
    """Build the GET/POST items view for a PC (`npc=False`) or NPC (`npc=True`)."""

    @_build_api_view(['GET', 'POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Return a paginated list of non-hidden items, or create a new item, for a PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        if request.method == 'POST':
            character = _get_character_or_404(game, character_id, npc=npc)
            return character_item_create(request, game, character)
        return character_items(request, game, character_id, npc=npc, check_hidden=npc)

    return view


def _check_character_all_permission(request, game, character_id, npc):
    """Return an error Response if the requester may not view/edit all items/documents, else None.

    An NPC's `/items/all.json` (or `/documents/all.json`, or `/items/remove/all.json`) is
    DM/superuser-only (`GameEditPermission`); a PC's own variant is additionally open to the
    PC's owning player (`CharacterEditPermission`). Shared by the items, documents, and (issue
    #773) item-remove `/all.json` view factories below — the branching is identical, only the
    calling endpoint differs.
    """
    if npc:
        return GameEditPermission.check(request, game)
    character = _get_character_or_404(game, character_id, npc=False)
    return CharacterEditPermission.check(request, character)


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
        error_response = GameEditPermission.check(request, game)
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
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_item_acquire(request, game, character)

    return view


def build_item_acquire_all_view(npc):
    """Build the DM-only POST items/acquire/all.json view for a PC or NPC."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Create a CharacterItem, including from a hidden GameItem — DM/admin only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = GameEditPermission.check(request, game)
        if error_response:
            return error_response
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_item_acquire(request, game, character, allow_hidden=True)

    return view


def build_item_remove_view(npc):
    """Build the POST items/remove.json view for a PC (npc=False) or NPC (npc=True)."""

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterItem owned by the PC/NPC."""
        game = get_object_or_404(Game, game_slug=game_slug)
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_item_remove(request, game, character)

    return view


def build_item_remove_all_view(npc):
    """Build the restricted POST items/remove/all.json view for a PC or NPC.

    PC: dm/admin/owner (CharacterEditPermission). NPC: dm/admin (GameEditPermission, no
    owner concept) — same asymmetric split `_check_character_all_permission` already applies
    to `items/all.json`/`documents/all.json`.
    """

    @_build_api_view(['POST'], AllowAny)
    def view(request, game_slug, character_id):
        """Remove a CharacterItem, including a hidden one — dm/admin(/owner for PCs) only."""
        game = get_object_or_404(Game, game_slug=game_slug)
        error_response = _check_character_all_permission(request, game, character_id, npc)
        if error_response:
            return error_response
        character = _get_character_or_404(game, character_id, npc=npc)
        return character_item_remove(request, game, character, allow_hidden=True)

    return view


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
        error_response = GameEditPermission.check(request, game)
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
        error_response = GameEditPermission.check(request, game)
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
