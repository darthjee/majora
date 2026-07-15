# Issue: Staff should have access to treasures page and endpoints

## Description
Staff users (Django `is_staff=True`) currently cannot access the global treasures page or perform treasure write operations, even though the backend's read endpoint (`GET /treasures.json`) is already public (`AllowAny`).

## Problem
- The frontend route guard in `accessRouteConfig.js` restricts the global `treasures`, `treasureNew`, and `treasureEdit` routes to `{ kind: 'superuser' }`, so staff members cannot open `/#/treasures` (or create/edit) at all.
- The backend write actions (create/update/delete) on `/treasures.json` are explicitly gated to `request.user.is_superuser`, excluding staff.
- Today's documented `Staff` role is strictly additive and scoped only to the User-management endpoints (`docs/agents/access-control/user-roles.md`, `docs/agents/product.md`). This issue extends that policy: staff should gain full access to resources that are **not scoped under a game** (e.g. global treasures, users), the same way superuser does. Resources scoped under a specific game (e.g. `/games/:game_slug/treasures`, the `gameTreasures`/`gameTreasureNew`/`gameTreasureEdit` routes) are explicitly **out of scope** and remain governed by existing game-level roles (GameMaster), not staff.

## Expected Behavior
- Staff users have full parity with superuser on the global treasures routes: `/#/treasures` (list), `/#/treasures/new`, and `/#/treasures/:id/edit` — viewing, creating, editing, and deleting treasures.
- Staff access does **not** extend to game-scoped treasure routes (`/games/:game_slug/treasures*`), which remain governed by game-level roles only.

## Solution
- Frontend: change the `kind` descriptor for `treasures`, `treasureNew`, and `treasureEdit` in `accessRouteConfig.js` from `superuser` to `staffOrSuperuser`, mirroring the existing `staffUsers`/`staffUser`/`staffUserEdit` pattern.
- Backend: update the superuser-only checks on treasure create/update/delete views (`backend/games/views/treasures/`) to also allow `request.user.is_staff`, e.g. via the existing `require_staff` helper (`backend/games/views/common.py`).
- Docs: update `docs/agents/access-control/user-roles.md` and `docs/agents/product.md` to reflect the broadened `Staff` policy — full access to any resource not scoped under a game (treasures, users), while remaining excluded from game-scoped resources.

## Benefits
Staff can manage global treasures and other non-game-scoped resources without needing full superuser privileges, consistent with the existing staff-user-management pattern, while game-scoped data stays protected under game-level roles.
