# Issue: Tasks page unreachable from nav

## Description

`GameTasks.jsx` is a complete, working frontend page (list, create, per-task edit via `TaskDetailModal`) for a game's tasks, and its route is fully registered:

- Route: `/games/:game_slug/tasks` → `HashRouteResolver.js:92`
- Page mapping: `gameTasks` → `<GameTasks />` in `AppHelper.jsx`
- Access config: `accessRouteConfig.js` / `AccessRouteConfigStore.js`

However, `NAV_LINK_REGISTRY` in `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` has no `gameItem('tasks', ...)` entry, unlike every other game sub-page (`pcs`, `npcs`, `treasures`, `items`, `possessions`, `factions`, `documents`, `players`, `polls`, `sessions`, `photos`).

## Problem

Today the Tasks page is only reachable by typing the URL/hash directly — there is no link to it anywhere in the app, including the header's Game nav dropdown where every sibling page (Players, Polls, Sessions, etc.) is listed.

## Expected Behavior

DMs, staff, and superusers should be able to reach the Tasks page from the Game nav dropdown, the same way they reach Polls, Sessions, and the other game sub-pages. Regular players should *not* see the link, matching the backend's `EndpointPermission(..., 'game_task', 'restricted', 'edit')` gate (DM or staff/superuser only — no public/player read path for tasks).

## Solution

Add a `gameItem('tasks', '/tasks', 'game_page.tasks', IS_DM_OR_ADMIN)` entry to `NAV_LINK_REGISTRY`, following the same pattern as `polls`/`sessions`.

- **i18n key**: `game_page.tasks` = `"Tasks"` (en) — matches the majority plain-key pattern already used for `sessions`, `players`, `treasures`, etc. in `game_page.yaml` (`polls_title`'s `_title` suffix exists only because of its own `open_polls_count`/`view_polls` sibling keys; no such collision applies here).
- **Placement**: right after `sessions`, before `photos` — groups it with the other DM/restricted-access items (`players`, `polls`, `sessions`) that already sit together near the end of `NAV_LINK_REGISTRY`.

### Gating design

The existing `Polls`/`Sessions`/`Players` nav entries use `HAS_GAME_ACCESS` (`{ all: ['isGamePage', 'hasGameAccess'] }`), but `hasGameAccess` (see `CurrentPageContext.js`) is `is_dm || is_player || is_superuser || is_staff` — it includes players. There is currently no rule primitive for "DM or staff/superuser, excluding players", so this needs:

- a new derived context field `isDmOrAdmin` added to `CurrentPageContext`, computed the same way as `hasGameAccess` but deliberately excluding `is_player`:
  ```js
  isDmOrAdmin: is_dm || is_superuser || is_staff
  ```
- a new rule constant in `HeaderNavHelper.jsx`, alongside `HAS_GAME_ACCESS`:
  ```js
  const IS_DM_OR_ADMIN = { all: ['isGamePage', 'isDmOrAdmin'] };
  ```
  used as `gameItem('tasks', '/tasks', 'game_page.tasks', IS_DM_OR_ADMIN)`.

**Decided:** no additional page-level guard on `GameTasks.jsx`/`GameTasksController`. A player who navigates to the Tasks URL directly (bypassing the now-hidden nav link) will still hit the backend's existing `403` from `EndpointPermission`, surfaced through `GameTasksController`'s existing error-state handling — the backend is already the real security boundary, and this issue stays scoped to the nav link's visibility only.

### Scope

This issue covers the nav-link fix only. The other gap found during investigation — `Task` having no single-resource `GET`/`DELETE` endpoint — is an independent, backend-only concern (different specialist agent, no dependency on this fix) and has been split off into #1314.

### Files involved

- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx`
- `frontend/assets/js/utils/context/CurrentPageContext.js`
- `frontend/assets/i18n/en/game_page.yaml` / `frontend/assets/i18n/pt/game_page.yaml`

Related: #1314

## Benefits

Makes an already-built, functional feature (task list/create/edit) actually usable without hand-typing a URL/hash, and keeps nav visibility consistent with the backend's real permission boundary (DM/staff/superuser only).
