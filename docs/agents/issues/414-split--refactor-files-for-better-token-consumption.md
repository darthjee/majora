# Issue: Split / refactor files for better token consumption

## Description

Two backend files have grown too large and mix too many responsibilities, hurting token efficiency when an AI agent needs to reason about the codebase:

- `backend/games/views/game/_character_shared.py` — 1,111 lines (44KB), a factory module building ~60 PC/NPC view pairs across 6 resource domains (photos, items, documents, factions, possessions, treasures) plus a handful of generic helpers.
- `backend/games/views/game/_treasure_exchange.py` — 297 lines (12KB), mixing treasure exchange logic (buy/sell/acquire/remove) with treasure lookup helpers.

The repo's Token Efficiency Score is 52/100 (Fair), with `_character_shared.py` the single largest offender in the backend.

## Problem

- `_character_shared.py` forces an AI agent working on any single resource domain (e.g. "treasures") to load and reason about the entire ~1,100-line file, most of which is irrelevant to that domain.
- `_treasure_exchange.py` mixes two responsibilities — treasure lookup/finding and treasure exchange execution — in one file.

## Expected Behavior

Pure refactor: no behavior change, no API change, no new features. All existing HTTP endpoints, function signatures, and call paths remain identical; the existing test suite (`backend/games/tests/views/game/pcs/`, `backend/games/tests/views/game/npcs/`) must pass unmodified.

## Solution

### Scope boundaries

#### In scope

- **`_character_shared.py`** — split by domain into 7 files (6 new + 1 reduced).
- **`_treasure_exchange.py`** — extract treasure finder functions into a separate file.
- **Refactor only** — no behaviour changes, no API changes, no new features.

#### Out of scope

- Frontend files (JS configs, AccessStore, etc.) — addressed separately.
- Other backend barrel files (`serializers/__init__.py`, `views/__init__.py`).
- Barrel file reduction across the codebase.
- TypeScript migration.
- Any changes to `_character_shared.py` consumers beyond import path updates.

### Alternative solutions considered

#### For `_character_shared.py`

| Alternative | Description | Verdict |
|-------------|-------------|---------|
| **A — Split by domain** | Extract each resource type's `build_*` functions into a `_domain_shared.py` file; keep generic helpers in the reduced `_character_shared.py`. | **Chosen** — aligns with existing pattern (`_item_exchange.py`, `_document_exchange.py`, etc.) and maximises token savings per domain. |
| B — Split by operation type | Group by responsibility (exchange base, photo management, factory) rather than by domain. | Rejected — breaks naming convention; lower token savings since an agent working on "treasures" would still need multiple files. |
| C — Package instead of module | Convert `_character_shared.py` into a `character_shared/` package with `__init__.py` for re-exports. | Rejected — adds directory nesting; `__init__.py` risks becoming a new barrel file. |

#### For `_treasure_exchange.py`

| Alternative | Description | Verdict |
|-------------|-------------|---------|
| A — Extract to classes | `GameTreasureFinder`, `TreasureBuyer`, `TreasureSeller` as static-method classes. | Rejected — adds indirection; static methods are functions with unnecessary `self`; 297 lines doesn't justify 4 files. |
| B — Split into 6 function modules | Separate files for finder, buy, sell, acquire, remove, base. | Rejected — over-splitting; each file would be ~50 lines; shared helpers would need yet another base file. |
| **C — Extract only finder** | Move `_find_game_treasure`, `_find_treasure_by_id`, and `_is_hidden` to `_treasure_finder.py`; keep the rest in `_treasure_exchange.py`. | **Chosen** — minimal change, separates the "find" responsibility from "execute exchange", aligns with issue suggestion. |
| D — Merge with `_character_shared.py` split | Absorb treasure exchange base logic into `_treasure_shared.py`. | Rejected — changes the relationship between the two files listed in the issue; `_treasure_exchange.py` already works well as a standalone module. |

### Plan

#### Part 1 — Split `_character_shared.py` (1,111 lines to 7 files)

Function inventory below was verified directly against the current file (61 top-level functions); it corrects three inaccuracies from the original proposal: 12 functions that exist in the file but were unassigned to any target file, and 3 function names that do not exist in the file at all (`build_item_create_view`, `build_item_update_view`, `build_possession_create_view` — item create/update are branches inside `build_items_view`/`build_item_detail_view`, and the real possession-acquire single-item factory is `build_possession_acquire_view`).

##### File: `_character_shared.py` (reduced, ~120 lines)

Retains only generic, cross-domain functions:

- `_build_api_view(methods, permission_class)` — decorator helper wrapping `@api_view` + `@permission_classes` + `get_object_or_404(Game)`.
- `_check_character_all_permission(request, game, character_id, npc)` — verifies DM/owner permission for `/all.json` endpoints; handles PC vs NPC asymmetry. Used by items, documents, factions, and possessions `all.json` endpoints. Note: the treasure domain does NOT use this helper — its `all.json` views call `check_game_edit` directly (dm/admin only, no PC-owner path), an existing asymmetry worth preserving as-is.
- `build_access_view(npc)` — builds the GET access/permissions view.
- `build_full_view(npc)` — builds the GET/PATCH full-detail view.

All imports that were solely for domain-specific `build_*` functions are removed.

##### File: `_photo_shared.py` (new, ~110 lines)

- `build_photos_view(npc)`
- `build_photo_upload_view(npc)`
- `build_photo_detail_view(npc)`
- `build_photo_deletable_view(npc)`
- `build_photo_set_view(npc)`

Imports: `_build_api_view` from `_character_shared.py`; photo functions from `_photo_upload.py`, `_photo_detail.py`, `_photo_deletable.py`, `_photo_set.py`.

##### File: `_item_shared.py` (new, ~270 lines)

- `build_items_view(npc)` — list GET, and POST create (dispatches to `character_item_create` from `._item_create`).
- `build_item_detail_view(npc)` — GET/PATCH detail (PATCH dispatches to `character_item_update` from `._item_update`).
- `build_items_all_view(npc, serializer_class)`
- `build_item_detail_full_view(npc, serializer_class)`
- `build_item_photo_upload_view(npc)`
- `build_items_available_view(npc)`
- `build_items_available_all_view(npc)`
- `build_item_acquire_view(npc)`
- `build_item_acquire_all_view(npc)`
- `build_item_remove_view(npc)`
- `build_item_remove_all_view(npc)`

Imports: `_build_api_view`, `_check_character_all_permission` from `_character_shared.py`; item functions from `_items.py`, `_item_create.py`, `_item_update.py`, `_item_exchange.py`, `_item_photo_upload.py`.

##### File: `_document_shared.py` (new, ~300 lines)

- `build_documents_view(npc, serializer_class)`
- `build_document_detail_view(npc, serializer_class)`
- `build_documents_all_view(npc, serializer_class)`
- `build_document_detail_full_view(npc, serializer_class)`
- `build_document_files_view(npc)`
- `build_document_files_all_view(npc)`
- `build_document_photos_view(npc)`
- `build_document_photos_all_view(npc)`
- `build_documents_available_view(npc)`
- `build_documents_available_all_view(npc)`
- `build_document_acquire_view(npc)`
- `build_document_acquire_all_view(npc)`
- `build_document_remove_view(npc)`
- `build_document_remove_all_view(npc)`

Imports: `_build_api_view`, `_check_character_all_permission` from `_character_shared.py`; document functions from `_documents.py`, `_document_exchange.py`, `_document_files.py`, `_document_photos.py`.

##### File: `_faction_shared.py` (new, ~200 lines)

- `build_factions_view(npc, serializer_class)`
- `build_faction_detail_view(npc, serializer_class)`
- `build_factions_all_view(npc, serializer_class)`
- `build_faction_detail_full_view(npc, serializer_class)`
- `build_factions_available_view(npc)`
- `build_factions_available_all_view(npc)`
- `build_faction_acquire_view(npc)`
- `build_faction_acquire_all_view(npc)`
- `build_faction_remove_view(npc)`
- `build_faction_remove_all_view(npc)`

Imports: `_build_api_view`, `_check_character_all_permission` from `_character_shared.py`; faction functions from `_factions.py`, `_faction_exchange.py`.

##### File: `_possession_shared.py` (new, ~160 lines)

- `build_possessions_view(npc, serializer_class)`
- `build_possession_detail_view(npc, serializer_class)`
- `build_possessions_all_view(npc, serializer_class)`
- `build_possession_detail_full_view(npc, serializer_class)`
- `build_possession_acquire_view(npc)`
- `build_possessions_available_view(npc)`
- `build_possessions_available_all_view(npc)`
- `build_possession_acquire_all_view(npc)`
- `build_possession_remove_view(npc)`
- `build_possession_remove_all_view(npc)`

Imports: `_build_api_view`, `_check_character_all_permission` from `_character_shared.py`; possession functions from `_possessions.py`, `_possession_exchange.py`.

##### File: `_treasure_shared.py` (new, ~90 lines)

- `build_treasures_view(npc)`
- `build_treasure_buy_view(npc)`
- `build_treasure_buy_all_view(npc)`
- `build_treasure_sell_view(npc)`
- `build_treasure_acquire_view(npc)`
- `build_treasure_acquire_all_view(npc)`
- `build_treasure_remove_view(npc)`

Imports: `_build_api_view` from `_character_shared.py`; `check_game_edit` from `..common`; `_get_character_or_404` from `_shared.py`; treasure functions from `_treasure_exchange.py`.

#### Part 2 — Extract finder from `_treasure_exchange.py` (297 lines to about 260 plus 40)

##### File: `_treasure_finder.py` (new, ~40 lines)

Extracted from `_treasure_exchange.py`:

- `_find_game_treasure(game, treasure_id, allow_hidden=False)` — returns the `Treasure` matching `treasure_id` scoped to `game`, or raises `Http404`. Also 404s on hidden treasures unless `allow_hidden=True`.
- `_find_treasure_by_id(treasure_id)` — returns a `Treasure` by ID without game scoping, or raises `Http404`.
- `_is_hidden(treasure)` — private helper used only by `_find_game_treasure`; must move with it since it has no other caller.

Imports: `Treasure` from `...models`, `Http404` from `django.http`.

##### File: `_treasure_exchange.py` (reduced, ~260 lines)

Retains all exchange logic:

- Entry points: `character_treasure_buy`, `character_treasure_sell`, `character_treasure_acquire`, `character_treasure_remove`.
- Internal: `_authorize_and_parse`, `_buy`, `_sell`, `_acquire`, `_remove`, `_capped_quantity`, `_record_acquired_units`, `_release_acquired_units`, `_lock_game_treasure`, `_lock_character`, `_lock_character_treasure`, `_lock_or_create_character_treasure`, `_resolve_value`.
- `_TreasureExchangeSerializer` (validation serializer).

New import: `_find_game_treasure`, `_find_treasure_by_id` from `_treasure_finder.py`.

### Import dependency graph

No circular dependencies among the new files themselves: each `_domain_shared.py` imports only from `_character_shared.py` (generic) and from domain-specific leaf modules that already exist — confirmed no existing leaf module under `views/game/` imports anything from `_character_shared.py`.

The open risk is external: roughly 110 one-line wrapper view files under `games/views/game/pcs/detail/**` and `games/views/game/npcs/detail/**` currently import `build_*` factories directly from `_character_shared`. Each of these call sites must be updated to import from the correct new domain module (`_photo_shared.py`, `_item_shared.py`, etc.) — `_character_shared.py` does **not** re-export the moved names, since doing so would recreate the circular import this split is meant to avoid.

### Edge cases

- **`_check_character_all_permission` PC vs NPC asymmetry**: this function has different permission paths for PC (`game_pc`/`restricted`/`edit`) vs NPC (`game`/`restricted`/`edit`). It must stay in `_character_shared.py` since it's used by items, documents, factions, and possessions `all.json` endpoints. Treasure `all.json` endpoints do not use it (see above) — that's pre-existing behavior, not something this refactor should change.
- **`build_access_view` and `build_full_view`**: these don't fit any single domain (they return character-level data, not resource-specific). They stay in `_character_shared.py` reduced.
- **Serializers imported in factory functions**: each `build_*` function receives `serializer_class` as a parameter from the caller. The import of specific serializer classes happens in the `__init__.py` of `views/game/pcs/` and `views/game/npcs/`, not in `_character_shared.py`. This means the domain split doesn't change serializer imports.
- **`_treasure_exchange.py` entry points called externally**: `character_treasure_buy`, `character_treasure_sell`, etc. are imported by `_character_shared.py` (current) / `_treasure_shared.py` (new). The public API of `_treasure_exchange.py` doesn't change — only the internal finder functions (and `_is_hidden`) move.

### Testing strategy

- **Existing tests must pass without modification** — this is a pure refactor with no behaviour change.
- The test suite at `backend/games/tests/views/game/pcs/` and `backend/games/tests/views/game/npcs/` covers all endpoints through integration tests.
- No new tests required — the refactor preserves the same function signatures and call paths.

### Permissions

No permission changes. All permission checks remain in the same functions, just in different files. `_check_character_all_permission` continues to use `EndpointPermission` with the same resource/action/variant tuples.

### Backward compatibility

- **Import paths change**: consumers of `_character_shared.py` must update imports to point to the new domain-specific files. The ~110 wrapper view files under `games/views/game/pcs/detail/**` and `games/views/game/npcs/detail/**` are the main call sites affected, and each one must be updated individually to import from the correct new domain module — `_character_shared.py` will not re-export the moved names, to avoid recreating a circular import.
- **No API changes**: all HTTP endpoints remain identical.
- **No data changes**: no migrations needed.
- **No serializer changes**: serializer classes continue to be passed as parameters.

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Largest backend view file | 1,111 lines | ~300 lines (`_document_shared.py`) |
| Tokens to reason about "treasures" | ~1,400 lines (full `_character_shared.py`) | ~90 lines (`_treasure_shared.py`) + ~260 lines (`_treasure_exchange.py`) + ~40 lines (`_treasure_finder.py`) = ~390 lines |
| Tokens to reason about "items" | ~1,400 lines | ~270 lines (`_item_shared.py`) |
| Files > 500 lines in `views/game/` | 1 | 0 |
