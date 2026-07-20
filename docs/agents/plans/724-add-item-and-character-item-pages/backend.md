# Backend Plan: Add Item and Character Item pages

Main plan: [plan.md](plan.md)

## Shared contracts

- Must expose the six GET endpoints listed in [plan.md](plan.md)'s "Shared contracts", with
  exactly the response shapes, permission gates, hidden-handling, and `X-Skip-Cache` behavior
  described there.
- No new serializer classes are needed — reuse `GameItemListSerializer`/`GameItemAllListSerializer`
  and `CharacterItemSerializer`/`CharacterItemAllSerializer` as-is; their existing field sets
  (`id`/`name`/`description`/`photo_path`, `+hidden` on the `All*` variants) already match what a
  single-item detail response needs.

## Implementation Steps

### Step 1 — `GameItem` detail views

Add two new views next to the existing `game_items`/`game_items_all` list views:

- `backend/games/views/games/game_item_detail.py` — `game_item_detail(request, game_slug, item_id)`.
  `AllowAny`, mirrors `game_items.py`: `game = get_object_or_404(Game, game_slug=game_slug)`, then
  `get_object_or_404(game.items.filter(hidden=False), id=item_id)`, return
  `Response(GameItemListSerializer(item).data)`.
- `backend/games/views/games/game_item_detail_all.py` — `game_item_detail_all(request, game_slug, item_id)`.
  Mirrors `game_items_all.py`: `GameEditPermission.check(request, game)` guard, queryset
  `game.items.all()` (hidden included), `GameItemAllListSerializer`, sets `X-Skip-Cache: true`.

Export both from `backend/games/views/games/__init__.py` and `backend/games/views/__init__.py`
(mirror the existing `game_items`/`game_items_all` export lines).

### Step 2 — `CharacterItem` detail: shared implementation

Add `character_item_detail(request, game, character_id, item_id, npc, check_hidden, allow_hidden=False, serializer_class=CharacterItemSerializer)`
to `backend/games/views/game/_items.py`, next to `character_items`. Mirror its structure closely:

- `character = _get_character_or_404(game, character_id, npc)`.
- If `check_hidden`, apply `_hidden_gate_response(character, request)` first (a hidden NPC 404s
  unless the requester can edit it) — same as the list endpoint.
- `items = character.character_items.select_related('game_item')`, `.exclude(hidden=True)`
  unless `allow_hidden`.
- `item = get_object_or_404(items, id=item_id)`, return `Response(serializer_class(item).data)`.
- If `check_hidden and character.hidden`, set `X-Skip-Cache: true` (same rule as `character_items`).

### Step 3 — `CharacterItem` detail: view factories

Add to `backend/games/views/game/_character_shared.py`, next to `build_items_view`/`build_items_all_view`:

- `build_item_detail_view(npc, serializer_class=CharacterItemSerializer)` — GET-only,
  `AllowAny`, view signature `(request, game_slug, character_id, item_id)`, calls
  `character_item_detail(..., check_hidden=npc, serializer_class=serializer_class)`.
- `build_item_detail_all_view(npc, serializer_class)` — GET-only, `AllowAny`, same signature,
  first calls `_check_items_all_permission(request, game, character_id, npc)` (already exists —
  `GameEditPermission` for NPC, `CharacterEditPermission` for PC), then
  `character_item_detail(..., check_hidden=npc, allow_hidden=True, serializer_class=serializer_class)`,
  and sets `X-Skip-Cache: true` on the response.

### Step 4 — Thin PC/NPC view modules

- `backend/games/views/game/pcs/detail/items/game_pc_item_detail.py`:
  `game_pc_item_detail = build_item_detail_view(npc=False)`
- `backend/games/views/game/pcs/detail/items/game_pc_item_detail_all.py`:
  `game_pc_item_detail_all = build_item_detail_all_view(npc=False, serializer_class=CharacterItemAllSerializer)`
- `backend/games/views/game/npcs/detail/items/game_npc_item_detail.py`:
  `game_npc_item_detail = build_item_detail_view(npc=True)`
- `backend/games/views/game/npcs/detail/items/game_npc_item_detail_all.py`:
  `game_npc_item_detail_all = build_item_detail_all_view(npc=True, serializer_class=CharacterItemAllSerializer)`

Export all four from `.../pcs/detail/items/__init__.py`, `.../npcs/detail/items/__init__.py`,
`backend/games/views/game/pcs/__init__.py`, `backend/games/views/game/npcs/__init__.py`, and
`backend/games/views/__init__.py` (mirror the existing `game_pc_items`/`game_npc_items` export lines
throughout).

### Step 5 — URL routing

- `backend/games/urls/games.py`: add, next to the existing `items.json`/`items/all.json` entries:
  ```python
  path('games/<slug:game_slug>/items/<int:item_id>.json', views.game_item_detail, name='game-item-detail'),
  path('games/<slug:game_slug>/items/<int:item_id>/all.json', views.game_item_detail_all, name='game-item-detail-all'),
  ```
- `backend/games/urls/_character_routes.py`: extend `_CHARACTER_ROUTES` with:
  ```python
  ('/items/<int:item_id>.json', 'item_detail'),
  ('/items/<int:item_id>/all.json', 'item_detail_all'),
  ```
  The shared `_character_route` builder already supports an extra id segment past
  `character_id` in `path_suffix` (see the existing `/photos/<int:photo_id>/set.json` entry,
  which resolves to `game_pc_photo_set`/`game_npc_photo_set` the same way) — no per-kind
  `urls.py` changes needed; this automatically wires to the `game_pc_item_detail(_all)` /
  `game_npc_item_detail(_all)` views added in Step 4 via the `game_<kind>_<name_suffix>` naming
  convention.

### Step 6 — Access-control docs

Add an "Item detail endpoints" section (or table row) to both
`docs/agents/access-control/game-item.md` and `docs/agents/access-control/character-item.md`,
next to each file's existing "Item index endpoints" section, documenting the six new routes,
their permission gates, and hidden-handling — per this repo's "update access-control docs
alongside any new endpoint" convention.

### Step 7 — Tests

Mirror the existing test tree:

- `backend/games/tests/views/games/game_item_detail_test.py`,
  `backend/games/tests/views/games/game_item_detail_all_test.py` — 200 for a visible item,
  404 for a hidden item on the public route, 200 (with `hidden`) on the `all.json` route for a
  DM/superuser, 401/403 for unauthenticated/non-DM on `all.json`, 404 for an unknown item/game.
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_detail_test.py`,
  `.../game_pc_item_detail_all_test.py` — same shape, plus confirming the PC's owning player gets
  `all.json` access (per `CharacterEditPermission`).
- `backend/games/tests/views/game/npcs/detail/items/game_npc_item_detail_test.py`,
  `.../game_npc_item_detail_all_test.py` — same shape, plus confirming a mere player of the game
  (no ownership relation to the NPC) is rejected from `all.json` (per `GameEditPermission`,
  admin/DM only), and the hidden-NPC gate 404s a non-editor on both routes.

## Files to Change

- `backend/games/views/games/game_item_detail.py`, `game_item_detail_all.py` — new.
- `backend/games/views/games/__init__.py`, `backend/games/views/__init__.py` — export the two new views.
- `backend/games/views/game/_items.py` — new `character_item_detail` shared function.
- `backend/games/views/game/_character_shared.py` — new `build_item_detail_view`/`build_item_detail_all_view` factories.
- `backend/games/views/game/pcs/detail/items/game_pc_item_detail.py`, `game_pc_item_detail_all.py` — new.
- `backend/games/views/game/npcs/detail/items/game_npc_item_detail.py`, `game_npc_item_detail_all.py` — new.
- `backend/games/views/game/pcs/detail/items/__init__.py`, `backend/games/views/game/pcs/__init__.py`,
  `backend/games/views/game/npcs/detail/items/__init__.py`, `backend/games/views/game/npcs/__init__.py` — export the new views.
- `backend/games/urls/games.py`, `backend/games/urls/_character_routes.py` — register the new routes.
- `docs/agents/access-control/game-item.md`, `docs/agents/access-control/character-item.md` — document the new endpoints.
- `backend/games/tests/views/games/...`, `backend/games/tests/views/game/pcs/detail/items/...`,
  `backend/games/tests/views/game/npcs/detail/items/...` — new tests mirroring the files above.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`) — covers the PC/NPC item detail tests.
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/ --cov` (CI job: `pytest_views_rest`) — covers the `GameItem` detail tests.
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes

- No new serializers, no new permission classes, no new models/migrations — this is purely new
  read-only views wired through existing building blocks, matching the issue's explicit scope
  (detail pages are read-only; create/update/photo-upload for items remain out of scope).
- The NPC `all.json` access is deliberately admin/DM-only, not owner-inclusive — confirmed during
  issue discussion to match every existing "NPCs have no owner concept" precedent in this codebase
  (`CharacterMoneyEditPermission`, `CharacterTreasureExchangePermission`,
  `CharacterItemCreatePermission`, and the existing `_check_items_all_permission`).
