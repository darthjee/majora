# Plan: Fix: As staff I cannot see the edit money link in the PC details page

Issue: [730-fix--as-staff-i-cannot-see-the-edit-money-link-in-the-pc-details-page.md](../issues/730-fix--as-staff-i-cannot-see-the-edit-money-link-in-the-pc-details-page.md)

## Overview

A staff user (Django `is_staff`, not scoped to a specific game) viewing a PC's details page does not see the "Edit" link under the money breakdown, even though every layer of the intended permission chain — backend permission check, serializer field, and frontend render gate — is already implemented and unit-tested to grant/show it. The bug is confirmed reproducible today. Since both ends check out individually, the defect almost certainly lives in the data flow between the character fetch and the render (frontend-only), not in the permission logic itself.

## Context

On `/@/games/<game_slug>/pcs/<id>`, `CharacterHelper.render` (`frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx:91-97`) renders `<CharacterMoney canEditMoney={character.can_edit_money} .../>`, which only appends the "Edit" link when `canEditMoney` is truthy (`CharacterMoneyHelper.jsx:35-46`). `character.can_edit_money` is expected to arrive as `true` straight from the base character-detail API response for any staff account, per `CharacterMoneyEditPermission.is_allowed` (`backend/games/permissions.py:117-130`, unconditional `if user.is_staff: return True`) via `CharacterDetailSerializer.get_can_edit_money` (`backend/games/serializers/characters/character_detail.py:57-61`).

**Already confirmed correct (do not re-litigate these — verified by existing passing tests and static reading):**
- Backend: `backend/games/tests/serializers/characters/character_detail_test.py::test_can_edit_money_is_true_for_staff_only_user` passes today and asserts exactly this scenario.
- Frontend render logic: `frontend/specs/.../CharacterHelper/moneyEditSpec.js` passes today, asserting the link renders when `can_edit_money` is `true` and is hidden when `false`/absent.
- `CharacterAccessResolver.merge` (`frontend/assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js:20-31`) spreads `...character` before overwriting only `can_edit`, `is_player`, `is_staff`, `access_resolved` — it does not touch or derive `can_edit_money`.
- `CharacterController.loadFullCharacter`/`mergeFullCharacter` (`frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js:94-162`) only merges the "full" (DM-only) response on top when `character.can_edit` is true, and the full serializer inherits `can_edit_money` unchanged — it doesn't strip it either way.
- The "View As" role-simulation facade (`AccessStorePermissions.js`, `AccessStoreFacade.js`) only affects the separate `*_permissions.json` endpoints that compute `can_edit` — it has no code path touching `can_edit_money`, which is always computed from the real `request.user` on the base character-detail endpoint.
- The `edit_money_button` translation key exists in both `en.yaml` and `pt.yaml`.

Given all of this, the fix requires an actual live reproduction rather than more static reading: confirm the real `can_edit_money` value returned by the network response for the specific repro account, and trace forward/backward from whichever side (API response vs. React state) turns out to be wrong.

## Implementation Steps

### Step 1 — Reproduce and capture the real signal
Reproduce with a staff test account against a running dev server. Open browser devtools' Network tab on the PC details page and inspect the actual JSON response for the character-detail request (`GET /games/<slug>/pcs/<id>.json` or equivalent):
- If `can_edit_money` is `false` in the raw response despite the account having `is_staff=True`, the bug is server-side after all (contradicting the passing unit test above) — check for a request-level discrepancy the unit test doesn't cover, e.g. `request.user` not being the expected `User` instance for this route specifically (add a temporary log of `request.user`, `request.user.is_staff` inside `get_can_edit_money` if needed), or a caching layer (`CacheControlMiddleware`, `backend/games/middleware.py`) serving a stale response captured before the account became staff (private cache, `max-age` from `Settings.cache_control_authenticated_max_age()` — try a hard refresh / fresh session to rule this out).
- If `can_edit_money` is `true` in the raw response but the link still doesn't render, the bug is in React state/rendering despite the render-logic unit test passing in isolation — check for a stale closure, a missed re-render after `setCharacter`, or another code path setting `character` state that doesn't come from `loadCharacter` (e.g. `handleUploadSuccess`, `handleMoneyConfirm`, `AuthEvents`/`FacadeRefresh` re-triggers in `CharacterDetail.jsx:51-58`) that could momentarily or permanently drop the field.

### Step 2 — Fix the confirmed root cause
Apply the minimal fix at the layer identified in Step 1 (backend serializer/view/caching, or frontend state wiring). Keep the existing permission semantics (staff always allowed, globally) intact — do not change `CharacterMoneyEditPermission`'s rules unless Step 1 shows they're actually the problem.

### Step 3 — Add regression coverage for the exact reported scenario
Add a test that exercises the full path this bug lives in (not just the already-covered unit boundaries) — e.g. an integration-style frontend spec that loads a PC details page as a staff, non-owning, non-GM account through the real controller flow and asserts the "Edit money" link appears, or a backend view-level test hitting the actual PC detail endpoint as a staff user and asserting `can_edit_money: true` in the response body (as opposed to only the serializer-level unit test that already exists).

## Files to Change
- Exact file(s) depend on Step 1's findings. Likely candidates based on the investigation above:
  - `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` or `CharacterAccessResolver.js` — if a state-merge path drops `can_edit_money`.
  - `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — if a re-fetch/re-render path is involved.
  - `backend/games/views/game/_detail.py` / `backend/games/middleware.py` — only if Step 1 shows a caching or request-context issue server-side.
  - Add/extend a regression test near the fix (frontend spec under `frontend/specs/...` or backend test under `backend/games/tests/views/game/pcs/...`).

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`) and `npm run coverage` (CI job: `jasmine`)
- `backend`: relevant `pytest_views_characters`/`pytest_views_rest`/`pytest_all` job, run via the project's local pytest command, only if a backend file ends up changed

## Notes
- This plan intentionally does not commit to a specific root cause — exhaustive static reading of the permission chain (backend permission check, serializer, frontend render gate, access resolver, controller merge logic, facade/role-simulation, translations) turned up no defect, while the bug is confirmed reproducible right now. Step 1's live reproduction is the critical unblocking step; do not skip it in favor of guessing.
- If Step 1 reveals the caching theory (stale private `Cache-Control` response for the PC detail endpoint), note that `character_detail` (`backend/games/views/game/_detail.py:9-27`) only sets `X-Skip-Cache` when `check_hidden=True`; the PC-detail route (`game_pc_detail.py`, `check_hidden=False`) does not, so its response — which bakes in the requesting user's own `can_edit_money`/`can_edit` — gets `Cache-Control: private, max-age=<N>` instead. `max-age` defaults to 10s in tests, so this is a narrow window, but worth ruling out if Step 1's repro is intermittent rather than solid.
