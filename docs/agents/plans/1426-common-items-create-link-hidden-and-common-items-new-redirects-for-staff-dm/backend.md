# Backend Plan: Common Items: "Create" link hidden and /common_items/new redirects for staff/DM

Main plan: [plan.md](plan.md)

## Overview
The game permissions response is missing `can_create_common_item`. Add it with the same roles
as `can_create_item` (the dm/admin shortcut, plus staff and any player). Those roles already
match the Common Item create endpoint rule in `game_common_item/endpoints.yml`
(`regular.create: [staff, player]`).

## Context
- `GameCommonItemsController` and `GameCommonItemNewController` (frontend) gate the create
  link and the `/common_items/new` page on `permissions.can_create_common_item`, taken from
  `AccessStore.ensureGamePermissions`, which reads `/permissions/game.json`. Because the key
  is missing, they always read `undefined`: the link is hidden and `/new` redirects.
- `PermissionsBuilder(page_key='game')` reads response keys from
  `backend/permissions/config/pages/game.yml` (`game: {action: response_key}`) and the roles
  for each action from `backend/permissions/config/game/ui.yml`. Both have `create_item`,
  `create_possession` and the other create actions, but neither has `create_common_item`.
- The field was left out when #826 (PR #1147) was built.

## Implementation Steps

### Step 1 — Expose `can_create_common_item` and document it
- In `backend/permissions/config/game/ui.yml`, add a `create_common_item` action with
  roles `[staff, player]`, placed after `create_item`, in the same style.
- In `backend/permissions/config/pages/game.yml`, add
  `create_common_item: can_create_common_item` under `game:`, placed after `create_item`.
- In `docs/agents/access-control/game.md`, in the `GET /permissions/game.json` section, add a
  `can_create_common_item` bullet shaped like `can_create_item`: roles per
  `game_common_item/endpoints.yml` (`create`), linking to
  [GameCommonItem](game-common-item.md). Optionally add a matching row or note to
  `docs/agents/access-control/game-common-item.md` saying that the UI create gate reads this flag.

### Step 2 — Update tests
- `backend/games/tests/views/permissions/game_permissions_test.py`: add
  `'can_create_common_item'` to `_all_false` (False) and `_all_true` (True). Also add it
  (True) to the explicit dicts in `test_player_cannot_edit_but_can_create_and_edit_session` and
  `test_staff_cannot_edit_but_can_create_and_edit_session`. Update any other exact-dict
  assertion in that file the same way.
- `backend/permissions/tests/builder_test.py`: add `'can_create_common_item': True` to
  `test_single_resource_page_returns_its_keys_only`, and update its docstring from "eight" to
  "nine" response keys.
- `backend/permissions/tests/page_config_store_test.py`: add
  `'create_common_item': 'can_create_common_item'` to the expected `game` page mapping.
- Grep the backend tests for any other exact-dict assertion on the game permissions payload
  (for example `grep -rn "can_create_faction" backend`) and add the new key there too, so
  nothing fails on an unexpected extra key.

## Files to Change
- `backend/permissions/config/game/ui.yml`: add the `create_common_item: [staff, player]` roles.
- `backend/permissions/config/pages/game.yml`: add the
  `create_common_item: can_create_common_item` response key.
- `docs/agents/access-control/game.md`: document the new flag (and optionally
  `game-common-item.md`).
- `backend/games/tests/views/permissions/game_permissions_test.py`: add the new key to the
  expected payloads.
- `backend/permissions/tests/builder_test.py`: add the new key to the expected payload.
- `backend/permissions/tests/page_config_store_test.py`: add the new mapping to the expected config.

## CI Checks
- `backend`: `docker-compose run --rm majora_tests pytest` and ruff (CI jobs: `pytest_views_rest`,
  `pytest_all`, `checks`)

## Notes
- No frontend logic change is needed. The controllers already read the right key, and their
  specs mock `ensureGamePermissions`. Check the fix manually: as staff/DM,
  `/#/games/:game_slug/common_items` shows the create link and
  `/#/games/:game_slug/common_items/new` stays open.
- Navi already warms `/permissions/game.json?role=...` (`navi/resources/permissions.yml`).
  The URLs don't change, so no Navi config change is needed, but cached responses keep lacking
  the new key until the cache is re-warmed or expires after deploy.
- Roles were confirmed with the user: they are the same as GameItem creation (dm/admin, staff,
  player).
