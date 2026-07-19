# Plan: Refactor backend: 10 code-quality improvements

Issue: [690-refacto-backend.md](../issues/690-refacto-backend.md)

## Overview

Ten concrete refactors to remove duplication and quality debt across `backend/games/`, found by exploring the whole backend tree (a prior refactor, #688, already cleaned up most oversized-method/complex-loop cases, so all 10 items here are repetition-focused). The PC/NPC parallel view/URL trees (#1, #2) are the largest and most systemic — tackle them first, since the `npc`-parameterized factory pattern established there may simplify the approach to some of the smaller items. The remaining 8 items are independent of each other and of #1/#2, and can be done in any order. Every step must preserve existing behavior and pass existing tests unchanged (adjusting test file locations/imports only where a refactor moves code).

## Context

Backend is a single Django app (`backend/games/`) using function-based `@api_view` views, one file per view/route, with a shared `views/common.py` for auth/pagination/access helpers (see [views-organization.md](../../views-organization.md)). Serializers follow one-class-per-file. There is no new entity, endpoint, or access-control change here — pure internal refactor, so no `product-owner`/`security`/`data-access` review is needed per [architecture.md](../../architecture.md).

## Implementation Steps

### Step 1 — PC/NPC parallel view trees (`games/views/game/pcs/` vs `games/views/game/npcs/`)

`backend/games/views/game/pcs/` mirrors `backend/games/views/game/npcs/` file-for-file (~15 pairs: `detail/game_pc_access.py` vs `detail/game_npc_access.py`, and matching money/items/photos/treasures subtrees). Every pair differs only by an `npc: bool` flag threaded into shared logic, the serializer/view class name, and minor wording. Introduce a shared parameterization (e.g. a base view class or factory function taking `npc: bool`, living in a new `games/views/game/_character_shared.py` or similar) that both the PC and NPC view modules call into, collapsing each duplicated pair down to a thin wrapper (or a single shared module where the two are truly identical aside from URL wiring). Keep the public view names/signatures used by `urls.py` unchanged so Step 2 and the frontend are unaffected.

### Step 2 — PC/NPC parallel `urls.py` trees

`backend/games/urls/pcs.py` (79 lines) and `backend/games/urls/npcs.py` (85 lines) duplicate the same path/name declarations, differing only by URL prefix (`pcs`/`npcs`) and view/serializer names. Extract a small route-building helper (e.g. a function that takes the `npc: bool` flag, prefix, and view module, and returns the list of `path(...)` entries) so both files become short calls into it. Do not change any existing URL path or route name — this must be a pure internal restructuring.

### Step 3 — Extract `Treasure.objects.for_game(game)` queryset helper

The exact queryset `Treasure.objects.filter(Q(linked_game=game) | Q(game=game)).distinct()` is duplicated in `backend/games/views/game/_treasure_exchange.py:80`, `backend/games/views/games/game_treasures_all.py:30`, `backend/games/views/games/game_treasure_detail.py:49`, and `backend/games/views/games/game_treasures.py:36`. Add a custom manager/queryset method `for_game(game)` on the `Treasure` model (in `backend/games/models/`) and replace all four call sites with it.

### Step 4 — Extract shared upload-init helper

`backend/games/views/photo_upload.py`, `backend/games/views/treasures/treasure_photo_upload.py`, and `backend/games/views/game/_photo_upload.py` each independently: validate `PhotoUploadSerializer`, build a file path, create the `Upload` record, create/attach the owning photo record, set `content_object`, save, and return `{upload_id, token, <owner>_id}`. Extract a shared helper (function or small class, e.g. `UploadInitiator`) parameterized by the owning photo model/field, and have all three views call into it.

### Step 5 — Extract shared `HiddenFieldSerializer` double-validation helper

`backend/games/views/treasures/treasure_detail.py:47-58`, `backend/games/views/games/game_treasure_detail.py:74-90`, `backend/games/views/games/game_treasures.py:67-84`, and `backend/games/views/games/game_treasure_link.py:32-40` each separately validate a main serializer plus `HiddenFieldSerializer(data=request.data)` and merge the two validated results. Extract a shared helper function (e.g. in `views/common.py` or a new `views/games/_hidden_field.py`) that both validates and merges, and update all four call sites.

### Step 6 — Add `Game.has_player(user, is_dm=None)` model method

`game.players.filter(user=user...).exists()` is reimplemented independently at `backend/games/permissions.py:41,67,89,126,167,236` and again at `backend/games/serializers/base_access.py:70`. Add a `has_player(self, user, is_dm=None)` method on the `Game` model and replace all these call sites.

### Step 7 — Extract shared "`hidden` field on `*AllSerializer`" mixin

`CharacterTreasureAllSerializer` (`backend/games/serializers/characters/character_treasure.py:31-46`), `CharacterItemAllSerializer` (`backend/games/serializers/characters/character_item.py:39-47`), `GameItemAllListSerializer` (`backend/games/serializers/games/items/game_item_list.py:19-28`), and `TreasureAllListSerializer` (`backend/games/serializers/treasures/treasure_list.py:27-40`) all follow the identical "subclass + add a `hidden` `SerializerMethodField` + extend `Meta.fields`" shape. Extract a shared mixin (e.g. `HiddenFieldMixin` in `backend/games/serializers/`) providing the `get_hidden`/field wiring, and have all four serializers use it.

### Step 8 — Extract `_filter_characters` into per-filter functions

`backend/games/views/game/_shared.py:41-68` inlines four independent query-param filters (slain/name/allegiance/hidden) in one function, while the equivalent treasure filtering was already extracted into standalone helpers in `backend/games/views/games/_treasure_filters.py` (`filter_by_min_value`/`filter_by_max_value`/`filter_by_name`). Apply the same per-filter-function extraction to `_filter_characters`, for consistency with the established pattern.

### Step 9 — Deduplicate the three game-session list views

`backend/games/views/game_sessions/game_sessions_future.py`, `game_sessions_past.py`, and `game_sessions_unscheduled.py` are each `get_object_or_404(Game...)` + a one-line date filter/order + `paginated_list_response(...)`, differing only in the filter/order clause. Extract a shared helper (function taking the queryset filter/order as a parameter, or a small shared base) and have all three call into it.

### Step 10 — Reuse `resolve_treasure_value()` in `_treasure_exchange.py`

`backend/games/views/game/_treasure_exchange.py:118` and `:165` each inline `value = treasure.value if game_treasure is None else game_treasure.value`, duplicating the existing shared helper `resolve_treasure_value()` in `backend/games/serializers/games/treasures/game_treasure_fields.py:19-21`. Replace both inline occurrences with a call to the existing helper (import it from the serializers module, or relocate it to a more neutral shared location if importing from `serializers` into `views` would be circular/awkward — check current import direction first).

## Files to Change

- `backend/games/views/game/pcs/**`, `backend/games/views/game/npcs/**` — collapse duplicated pairs via shared parameterization (Step 1)
- `backend/games/urls/pcs.py`, `backend/games/urls/npcs.py` — collapse via shared route-building helper (Step 2)
- `backend/games/models/` (`Treasure` model file) — add `for_game(game)` manager/queryset method (Step 3)
- `backend/games/views/photo_upload.py`, `backend/games/views/treasures/treasure_photo_upload.py`, `backend/games/views/game/_photo_upload.py` — use shared upload-init helper (Step 4)
- `backend/games/views/treasures/treasure_detail.py`, `backend/games/views/games/game_treasure_detail.py`, `backend/games/views/games/game_treasures.py`, `backend/games/views/games/game_treasure_link.py` — use shared hidden-field double-validation helper (Step 5)
- `backend/games/models/` (`Game` model file), `backend/games/permissions.py`, `backend/games/serializers/base_access.py` — add and use `Game.has_player()` (Step 6)
- `backend/games/serializers/characters/character_treasure.py`, `character_item.py`, `backend/games/serializers/games/items/game_item_list.py`, `backend/games/serializers/treasures/treasure_list.py` — use shared hidden-field mixin (Step 7)
- `backend/games/views/game/_shared.py` — extract per-filter functions (Step 8)
- `backend/games/views/game_sessions/game_sessions_future.py`, `game_sessions_past.py`, `game_sessions_unscheduled.py` — use shared list-view helper (Step 9)
- `backend/games/views/game/_treasure_exchange.py` — reuse `resolve_treasure_value()` (Step 10)
- Corresponding files under `backend/games/tests/` — update imports/paths only where a refactor moves code; no test behavior changes expected

## CI Checks

- `backend`: `poetry run pytest` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all` — split by test path, run together for full coverage)
- `backend`: `poetry run ruff check .` (CI job: `checks` — lint)
- `backend`: `bin/reports.sh ci` (CI job: `checks` — complexity check)

## Notes

- All 10 items are pure internal refactors: no new endpoints, no behavior change, no access-control change — `product-owner`/`security`/`data-access` review is not required.
- Steps 1 and 2 are the largest and most systemic; the other 8 steps are independent of each other and can be parallelized or reordered freely.
- Step 10's helper is currently defined in `serializers/`; if importing it from `views/` causes a circular import, consider relocating `resolve_treasure_value()` to a neutral shared module instead of importing across layers.
- Existing tests must keep passing; if a refactor changes internal structure enough that a test's import path needs updating, update the import only — not the assertions.
