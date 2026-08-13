# Plan: Backend — PATCH permissions for possessions, items, and factions

Issue: [1097_backend---patch-permissions-for-possessions--items--and-factions.md](../../issues/1097-backend---patch-permissions-for-possessions--items--and-factions.md)

## Overview
`PATCH /games/:game_slug/possessions/:id.json`, `.../items/:id.json`, and `.../factions/:id.json` currently gate through the shared, game-level `check_game_edit()` helper (admin/dm only). This plan adds a resource-specific `regular.edit` permission tier — `[staff, player]` — to each of the three resources' permission configs, mirroring the `game_pc_item` precedent from #864, and rewires the three PATCH views to check it instead of `check_game_edit()`.

## Context
- `EndpointPermission(request.user, game=game).check(request, resource, type_, action)` (`backend/permissions/endpoint.py`) already grants admin/dm automatically via `BasePermission._shortcut_allows()` — listing only `staff`/`player` in the new tier is sufficient to satisfy "admin and dm as always/default; player and staff should also have access".
- `backend/permissions/config/game_pc_item/{endpoints.yml,ui.yml}` is the precedent: both files define a `create_update` tier (`regular.create_update` in endpoints.yml) listing `staff, player, owner`. `owner` doesn't apply to possessions/items/factions (no per-character ownership), so the new tier is `[staff, player]` only.
- `game_possession/endpoints.yml`, `game_item/endpoints.yml`, and `game_faction/endpoints.yml` already exist with a `regular` block containing `create` and `photo_upload` tiers (both `[staff, player]`) — the new `edit` tier is added alongside them. None of the three currently has a `ui.yml`.
- Nothing currently calls `UIPermission` for these three resources (no `/permissions` endpoint or `*PermissionsSerializer` exists for them yet — that's tracked in a sibling #944 sub-issue). The `ui.yml` files added here are forward-looking config, unexercised by this issue's own code paths, added now per explicit user decision to mirror the `game_pc_item` precedent exactly.
- `check_game_edit()` (`backend/games/views/common.py:24`) stays as-is — it's still used by many other game-level, admin/dm-only endpoints (treasures, documents, npcs, photo uploads, etc.); only the three PATCH views below stop using it.
- Explicitly out of scope: `game_possession_detail_full.py`, `game_item_detail_full.py`, and the faction equivalent (GET-only, intentionally DM/admin-only — they expose hidden entities) — these keep using `check_game_edit()` unchanged. Documents' PATCH endpoint (doesn't exist yet) and the frontend Edit-button visibility are tracked in sibling #944 sub-issues.

## Implementation Steps

### Step 1 — Add the `regular.edit` tier to each resource's `endpoints.yml`
In `backend/permissions/config/game_possession/endpoints.yml`, `backend/permissions/config/game_item/endpoints.yml`, and `backend/permissions/config/game_faction/endpoints.yml`, add an `edit` key under the existing `regular:` block:
```yaml
regular:
  create:
    - staff
    - player
  photo_upload:
    - staff
    - player
  edit:
    - staff
    - player
```
Update each file's leading comment to mention the new PATCH-edit rule (issue #1097), following the existing comment style (e.g. `game_possession/endpoints.yml`'s current comment references `GamePossessionCreatePermission/GamePossessionPhotoUploadPermission (issue #1074)`).

### Step 2 — Create `ui.yml` for each resource
Create `backend/permissions/config/game_possession/ui.yml`, `backend/permissions/config/game_item/ui.yml`, and `backend/permissions/config/game_faction/ui.yml` (none exists yet), each containing just the new tier, mirroring `game_pc_item/ui.yml`'s flat (non-nested) shape:
```yaml
edit:
  - staff
  - player
```

### Step 3 — Switch the three PATCH views to the resource-specific check
In `backend/games/views/games/game_possession_detail.py`, `game_item_detail.py`, and `game_faction_detail.py`:
- Replace the `check_game_edit(request, game)` call in each file's `_update_*`/PATCH-handling function with `EndpointPermission(request.user, game=game).check(request, '<resource>', 'regular', 'edit')`, where `<resource>` is `game_possession`, `game_item`, or `game_faction` respectively.
- Update imports: drop `check_game_edit` from the `..common` import (unless the file uses it elsewhere — check each file), add `from permissions import EndpointPermission` (matching the import already used in `_possession_create.py`/`_item_create.py`/`_faction_create.py` and `game_faction_photo_upload.py`).

### Step 4 — Update existing tests
In `backend/games/tests/views/games/game_possession_detail_test.py`, `game_item_detail_test.py`, and `game_faction_detail_test.py`:
- `test_patch_with_non_dm_user_returns_403` stays valid as-is (the existing `other_user` fixture has no `PlayerFactory` tie to the game, so it's still forbidden under the new tier too) — verify this holds for each of the three files.
- Add two new PATCH test cases per file, following the pattern already used in `game_possession_photo_upload_test.py` (`test_staff_user_returns_201` / `test_player_of_game_returns_201`):
  - A staff (`UserFactory(..., is_staff=True)`, no game relationship) user's PATCH now returns 200 and persists the change.
  - A player of the game (`PlayerFactory(game=..., user=...)`, non-dm) user's PATCH now returns 200 and persists the change.

## Files to Change
- `backend/permissions/config/game_possession/endpoints.yml` — add `regular.edit: [staff, player]`
- `backend/permissions/config/game_possession/ui.yml` — new file, `edit: [staff, player]`
- `backend/permissions/config/game_item/endpoints.yml` — add `regular.edit: [staff, player]`
- `backend/permissions/config/game_item/ui.yml` — new file, `edit: [staff, player]`
- `backend/permissions/config/game_faction/endpoints.yml` — add `regular.edit: [staff, player]`
- `backend/permissions/config/game_faction/ui.yml` — new file, `edit: [staff, player]`
- `backend/games/views/games/game_possession_detail.py` — swap `check_game_edit()` for `EndpointPermission(...).check(request, 'game_possession', 'regular', 'edit')`
- `backend/games/views/games/game_item_detail.py` — swap `check_game_edit()` for `EndpointPermission(...).check(request, 'game_item', 'regular', 'edit')`
- `backend/games/views/games/game_faction_detail.py` — swap `check_game_edit()` for `EndpointPermission(...).check(request, 'game_faction', 'regular', 'edit')`
- `backend/games/tests/views/games/game_possession_detail_test.py` — add staff/player PATCH-success tests
- `backend/games/tests/views/games/game_item_detail_test.py` — add staff/player PATCH-success tests
- `backend/games/tests/views/games/game_faction_detail_test.py` — add staff/player PATCH-success tests

## CI Checks
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job: `pytest_views_rest`)

## Notes
- The `ui.yml` files added in Step 2 have no consumer yet within this issue's scope — they exist purely to match the `game_pc_item` precedent per an explicit product decision, and will become load-bearing once the sibling #944 frontend sub-issue (or a future issue) adds a permissions-serializer/endpoint for these three resources.
- Double-check each of the three view files' imports after removing `check_game_edit` — `game_possession_detail.py` also imports `validated_or_error` from the same `..common` module, so only the `check_game_edit` name should be dropped, not the whole import line.
