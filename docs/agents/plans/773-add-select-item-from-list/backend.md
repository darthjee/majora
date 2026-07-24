# Backend Plan: Add select item from list

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full endpoint table and permission split.
Key point for this agent: reuse `CharacterItemCreatePermission` (public acquire/remove),
`GameEditPermission` (acquire/all, available/all — dm/admin only, no owner), and the existing
`_check_character_all_permission` helper (remove/all — PC owner-inclusive, NPC owner-exclusive)
as-is. No new permission classes.

## Implementation Steps

### Step 1 — New implementation module `_item_exchange.py`

New file `backend/games/views/game/_item_exchange.py`, mirroring `_treasure_exchange.py`'s
shape but simplified — no quantity/money/stock-cap logic, since `CharacterItem` has no
`quantity` and acquiring is free:

```python
"""Shared implementation for the character item available-list/acquire/remove endpoints."""

from django.http import Http404
from rest_framework import serializers
from rest_framework.response import Response

from ...models import CharacterItem, GameItem
from ...permissions import CharacterItemCreatePermission
from ...serializers import CharacterItemDetailFullSerializer
from ..common import paginated_list_response, validated_or_error
from ..games._treasure_filters import filter_by_name
from ._shared import _get_character_or_404, _hidden_gate_response


class _ItemAcquireSerializer(serializers.Serializer):
    game_item_id = serializers.IntegerField()
    hidden = serializers.BooleanField(required=False, default=None, allow_null=True)


class _ItemRemoveSerializer(serializers.Serializer):
    game_item_id = serializers.IntegerField()


def character_items_available(
    request, game, character_id, npc, check_hidden, allow_hidden=False,
    serializer_class=None,
):
    """Return a paginated GameItem catalog, minus items `character` already owns.

    Mirrors `character_items` (`_items.py`)'s hidden-character gate and hidden-item
    filtering, but queries `game.items` (the catalog) instead of `character.character_items`
    (owned rows), excluding any GameItem id already linked to the character.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    owned_ids = character.character_items.values_list('game_item_id', flat=True)
    items = game.items.exclude(id__in=owned_ids)
    if not allow_hidden:
        items = items.exclude(hidden=True)
    items = filter_by_name(request, items)

    response = paginated_list_response(request, items, serializer_class)
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def character_item_acquire(request, game, character, allow_hidden=False):
    """Create a CharacterItem linking `character` to a submitted GameItem.

    `allow_hidden` bypasses the hidden-GameItem 404 gate — reserved for the DM-only
    `/acquire/all.json` endpoints, mirroring `character_treasure_acquire`'s `allow_hidden`.
    """
    error_response = CharacterItemCreatePermission.check(request, character)
    if error_response:
        return error_response

    serializer = _ItemAcquireSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    game_item = _find_game_item(game, serializer.validated_data['game_item_id'], allow_hidden)
    hidden = serializer.validated_data['hidden']
    if hidden is None:
        hidden = game_item.hidden

    character_item, created = CharacterItem.objects.get_or_create(
        character=character, game_item=game_item, defaults={'hidden': hidden},
    )
    if not created:
        return Response({'errors': {'game_item_id': ['already owned']}}, status=400)

    return Response(CharacterItemDetailFullSerializer(character_item).data, status=201)


def character_item_remove(request, game, character, allow_hidden=False):
    """Delete the CharacterItem linking `character` to a submitted GameItem.

    `allow_hidden` bypasses the hidden-CharacterItem 404 gate — reserved for the DM-only
    `/remove/all.json` endpoints.
    """
    error_response = CharacterItemCreatePermission.check(request, character)
    if error_response:
        return error_response

    serializer = _ItemRemoveSerializer(data=request.data)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    character_item = character.character_items.filter(
        game_item_id=serializer.validated_data['game_item_id'],
    ).first()
    if character_item is None or (character_item.hidden and not allow_hidden):
        raise Http404

    character_item.delete()
    return Response(status=204)


def _find_game_item(game, game_item_id, allow_hidden):
    """Return the GameItem matching `game_item_id` scoped to `game`, or raise Http404."""
    game_item = game.items.filter(id=game_item_id).first()
    if game_item is None:
        raise Http404
    if not allow_hidden and game_item.hidden:
        raise Http404
    return game_item
```

Note: `available/all.json`/`acquire/all.json` are gated by `GameEditPermission` (checked by
the *view factory*, before calling into `character_item_acquire`/`character_items_available`
with `allow_hidden=True`) — `character_item_acquire` itself only enforces
`CharacterItemCreatePermission`, matching `character_treasure_acquire`'s split between the
inline permission check and the caller-supplied `allow_hidden`.

`filter_by_name` (from `games/views/games/_treasure_filters.py`) is a generic
`name__icontains` helper already parameterized by `field` — reuse directly rather than
duplicating; its current home in a "treasure" module is pre-existing and out of scope to move.

### Step 2 — View factories in `_character_shared.py`

Add six factories to `backend/games/views/game/_character_shared.py`, following the exact
shape of `build_items_view`/`build_items_all_view`/`build_treasure_acquire_view`/
`build_treasure_acquire_all_view` already there:

```python
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
```

Add the needed imports at the top of `_character_shared.py`:
`from ...serializers import GameItemAllListSerializer, GameItemListSerializer` and
`from ._item_exchange import character_item_acquire, character_item_remove, character_items_available`.

### Step 3 — Routes

Add six entries to `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py`, right
after the existing `items/*` block (before the `treasures.json` block):

```python
    ('/items/available.json', 'items_available'),
    ('/items/available/all.json', 'items_available_all'),
    ('/items/acquire.json', 'item_acquire'),
    ('/items/acquire/all.json', 'item_acquire_all'),
    ('/items/remove.json', 'item_remove'),
    ('/items/remove/all.json', 'item_remove_all'),
```

### Step 4 — Thin per-kind view files

For both `backend/games/views/game/pcs/detail/items/` and
`backend/games/views/game/npcs/detail/items/`, add six one-line files mirroring
`game_pc_items_all.py`/`game_pc_treasure_acquire.py`'s shape, e.g.:

```python
# game_pc_items_available.py
"""View for the PC items/available.json endpoint."""
from ...._character_shared import build_items_available_view
game_pc_items_available = build_items_available_view(npc=False)
```

...and the same pattern for `game_pc_items_available_all.py` (→
`build_items_available_all_view`), `game_pc_item_acquire.py` (→ `build_item_acquire_view`),
`game_pc_item_acquire_all.py` (→ `build_item_acquire_all_view`), `game_pc_item_remove.py` (→
`build_item_remove_view`), `game_pc_item_remove_all.py` (→ `build_item_remove_all_view`) — and
the `npc=True` / `game_npc_*` counterparts.

Wire each new name into `pcs/__init__.py` / `npcs/__init__.py` (`from .detail.items....` import
+ `__all__` entry) and, one level up, `views/game/__init__.py` / `views/__init__.py`'s
re-exports — following exactly the same pattern the existing `game_pc_items_all`/
`game_pc_treasure_acquire` entries already use in each of those files.

### Step 5 — Tests

- `backend/games/tests/permissions_test.py`: no new permission class, so no new tests needed
  there — existing `CharacterItemCreatePermission`/`GameEditPermission` coverage already
  applies.
- New test files under `backend/games/tests/views/game/pcs/detail/items/` and
  `.../npcs/detail/items/` (mirroring the treasure acquire/remove test files' structure,
  renamed `*_acquire_test.py → *_buy_test.py` per issue #811 — use the **current** treasure
  acquire test file as the template, not the pre-#811 name):
  - `available`: 200 excludes owned items; excludes hidden for a plain player; `available/all`
    includes hidden but only for dm/admin (403 for owner/staff/player); still excludes owned.
  - `acquire`: 201 creates a `CharacterItem` with empty `name`/`description`; `hidden` defaults
    to the `GameItem`'s own `hidden` when omitted, respects submitted value otherwise; 400 on
    re-acquiring an already-owned `GameItem`; 404 for a hidden `GameItem` via the public
    endpoint; 401/403 for unauthenticated/unauthorized; `acquire/all` succeeds for a hidden
    `GameItem` but only for dm/admin (403 for owner/staff).
  - `remove`: 204 deletes the row; 404 if not owned; 404 if owned but hidden via the public
    endpoint; `remove/all` succeeds for a hidden item for dm/admin always, and additionally for
    the owning player on a **PC** (403 for the owning "player" of an **NPC**, since NPCs have
    no owner); 403 for staff on `remove/all` (staff excluded, unlike the public endpoint).

## Files to Change

- `backend/games/views/game/_item_exchange.py` (new)
- `backend/games/views/game/_character_shared.py` — six new factories + imports
- `backend/games/urls/_character_routes.py` — six new route entries
- `backend/games/views/game/pcs/detail/items/game_pc_items_available.py` (new)
- `backend/games/views/game/pcs/detail/items/game_pc_items_available_all.py` (new)
- `backend/games/views/game/pcs/detail/items/game_pc_item_acquire.py` (new)
- `backend/games/views/game/pcs/detail/items/game_pc_item_acquire_all.py` (new)
- `backend/games/views/game/pcs/detail/items/game_pc_item_remove.py` (new)
- `backend/games/views/game/pcs/detail/items/game_pc_item_remove_all.py` (new)
- `backend/games/views/game/npcs/detail/items/` — same six files, NPC-scoped
- `backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`
- `backend/games/views/game/__init__.py`, `backend/games/views/__init__.py`
- `backend/games/permissions.py` — broaden `CharacterItemCreatePermission`'s docstring only
  (no behavior change)
- new test files under `backend/games/tests/views/game/pcs/detail/items/` and
  `backend/games/tests/views/game/npcs/detail/items/`

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No migration needed — no model/field changes, only new views/routes.
- `character_item_acquire` uses `get_or_create` (not `select_for_update`-style locking like
  `_treasure_exchange.py`) since the only invariant is the `unique_together` DB constraint, not
  a money/quantity balance — `get_or_create` is already atomic against that constraint, and
  there's no shared numeric state to protect. This is a deliberate simplification versus the
  treasure precedent, not an oversight.
- Confirm during implementation whether `GameItemListSerializer`/`GameItemAllListSerializer`
  need to be added to `games/serializers/__init__.py`'s public re-exports if not already there
  (they're currently only used within `views/games/`).
