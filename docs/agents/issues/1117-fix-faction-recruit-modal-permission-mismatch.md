# Issue: Fix faction recruit modal permission mismatch

## Description

In `/#/games/:game_slug/factions/:id`, the recruit modal calls the privileged endpoint `/games/:game_slug/pcs/:id/factions/acquire/all.json` (which recruits including hidden factions) for users who are not DM/admin of that specific game.

Originally reported as a possible `RequestStore` misuse, but investigation shows `RequestStore` is already used correctly — the actual bug is a frontend permission-gating mismatch (see Problem below).

## Problem

The frontend gate that decides whether to call the privileged `acquire/all.json` variant vs. the regular `acquire.json` variant is `#canRecruitHidden` in `GameFactionController.js` (and the equivalent `#canGiveHidden` gate in three sibling controllers), computed as:

```js
is_superuser || is_dm || is_staff
```

`is_staff` here comes from `GET /games/{game_slug}/access.json` → `BaseAccessSerializer._get_is_staff` (`backend/games/serializers/base_access.py`), which returns **global Django `user.is_staff`** — not scoped to the specific game.

The backend endpoint itself (`build_faction_acquire_all_view` → `check_game_edit` → `EndpointPermission` → `Roles.is_admin() or Roles.is_dm()`, `backend/permissions/base.py`) only grants access via `is_superuser` or **per-game** `is_dm`. Global staff is never sufficient for this restricted/edit game action on the backend, so a user who is a global Django staff member but only a regular player (not DM) of this specific game sees the privileged "recruit/give hidden" UI and triggers the call, which the backend then correctly rejects with 403 — but the frontend shouldn't be offering/calling it in the first place.

The same `is_superuser || is_dm || is_staff` pattern exists in three sibling controllers:

- `frontend/assets/js/components/resources/faction/pages/controllers/GameFactionController.js:119-121` — `#canRecruitHidden`
- `frontend/assets/js/components/resources/document/pages/controllers/GameDocumentController.js:115` — `#canGiveHidden`
- `frontend/assets/js/components/resources/item/pages/controllers/GameItemController.js:120` — `#canGiveHidden`
- `frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js:102` — `#canGiveHidden`

## Expected Behavior

Global staff is intended to act as **a player of every game**, not as a DM/admin of every game:

- Any DM-only action gate (`canRecruitHidden`, `canGiveHidden`) should **not** include `is_staff` — matching the backend, which never grants DM-level actions to global staff.
- Player-level action gates that already include `is_staff` alongside `is_player` (e.g. `canUploadPhoto`) are correct as-is and stay unchanged.
- A global staff member with no membership in a given game can still reach the faction/document/item/treasure pages and use the normal (non-hidden) edit modals, same as any player — they just won't see the restricted "recruit/give hidden" action. This is the desired end state, not a regression.
- A DM or superuser who also happens to be global staff is unaffected either way, since `is_dm`/`is_superuser` alone already satisfy the gate.

## Solution

Fix the `is_superuser || is_dm || is_staff` pattern (dropping `is_staff`, keeping `is_superuser || is_dm`) in the four controllers listed under Problem.

### Explicitly out of scope

- `#canUploadPhoto` gates (faction/document/item/treasure/game/possession/character controllers) — these correctly OR `is_staff` alongside `is_player`, matching the "staff acts as a player of every game" product rule. No change needed.
- Poll page-visibility gates (`GamePollController.js` and friends) — `is_staff` there only controls page render/redirect, not a mutating action; the actual mutate gates (`#canVote`, `#canClose`) already correctly exclude `is_staff`.
- Global-staff admin features gated by `ensureStaffOrSuperUser()` (staff dashboard, staff user management, collections, sources, STL models, treasure admin) — these are genuinely global-staff features and correctly use global `is_staff`.

### Testing strategy

- Add/extend frontend controller specs for each of the 4 fixed controllers: a user with global `is_staff=true` but `is_dm=false`/`is_player=true` for the game must NOT see `canRecruitHidden`/`canGiveHidden` resolve to true.
- Confirm existing backend test coverage (e.g. `game_pc_faction_acquire_all_test.py`, which already asserts 403 for a global-staff user) stays green — backend needs no change, this is a frontend-only fix.
