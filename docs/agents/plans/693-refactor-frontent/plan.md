# Plan: Refactor Frontend

Issue: [693-refactor-frontent.md](../issues/693-refactor-frontent.md)

## Overview

Pure internal refactor of `frontend/` fixing the 12 concrete complexity cases found during
issue discussion: 7 duplication cases, 2 oversized form components, 2 components with
orchestration logic that belongs in a controller, and 1 helper with duplicated JSX. No
user-visible behavior changes; existing specs must stay green, extended where new units are
extracted.

Only the `frontend` specialist agent has work for this issue — no split needed.

## Context

A frontend survey (see the issue file's Problem section) found that this codebase already
follows a consistent Controller/Helper split and a `#renderX` private-method convention almost
everywhere. The candidates below are the genuine outliers, not a general rewrite.

## Implementation Steps

### Step 1 — Extract `parseJsonOrReject` HTTP helper

Create `frontend/assets/js/utils/http/parseJsonOrReject.js` exporting a function
`parseJsonOrReject(response, message)` that replaces the repeated
`response.ok ? response.json() : Promise.reject(new Error(message))` idiom. Update all call
sites: `utils/access/store/AccessStorePermissions.js:159-160`, `AccessStoreAccess.js:139-140`,
`AccessStoreAdmin.js:96-97`, `resources/game/pages/controllers/GamePollController.js:159-160,182-183,204-205,210-211`,
`resources/game/pages/elements/controllers/PollCloseModalController.js:73-74`,
`resources/game_session/pages/controllers/GameSessionController.js:66-67`,
`resources/staff_user/pages/controllers/StaffUserController.js:82-83`,
`resources/account/pages/controllers/MyAccountController.js:94-95`,
`resources/treasure/pages/controllers/TreasureController.js:66-67`,
`common/base/controllers/BaseEditController.js:98-99,119-120`. Keep each call site's original
error message text as the `message` argument.

### Step 2 — Consolidate `#redirectToGame` into `BasePageController`

Add a `redirectTo(hash)` method to `common/base/controllers/BasePageController.js` (the
`if (typeof window !== 'undefined') { window.location.hash = ... }` guard). Remove the
byte-identical private `#redirectToGame` from `GamePollController.js:148-152`,
`GamePollsController.js:102-105`, and `GameTasksController.js:182-186` (all three already
extend `BasePageController`), replacing call sites with `this.redirectTo(...)`.

### Step 3 — Consolidate `buildReadOnlyActionBarProps()`

Keep a single exported `buildReadOnlyActionBarProps()` (`{ canEdit: false, secondaryButtons: [] }`)
in `common/list_types/listTypeConfig.js`, and import it from
`common/list_types/configs/characterListTypes.js:68-70` and
`common/list_types/configs/characterTreasureListTypes.js:125-127` instead of redefining it.

### Step 4 — Extract `fetchPermissionGatedIndex` helper

Add a shared helper (e.g. `common/list_types/fetchPermissionGatedIndex.js`) implementing the
"resolve `can_edit` → pick `all.json` vs. plain endpoint → `fetchIndex` → normalize
`{data, pagination, canEdit}`" pattern, parameterized by `(gameSlug, { allPath, plainPath },
filterParams, client)`. Replace the 5 independent implementations: `fetchTreasures`
(`listTypeConfig.js:30-44`), `fetchGameItems` (`listTypeConfig.js:109-122`),
`buildFetchCharacterItems` (`listTypeConfig.js:135-155`), `fetchNpcs`
(`configs/characterListTypes.js:45-59`), `fetchNpcTreasuresList`
(`configs/characterTreasureListTypes.js:72-85`) with calls into the shared helper.

### Step 5 — Extract shared `BrowsePager` component

Create `common/pagination/BrowsePager.jsx` (prev/next buttons + "page / pages" label),
following the existing Component/Controller/Helper split only if the extracted block needs
one (it's presentation-only, so a plain component may be enough — check whether the original
27-line block has any local state before deciding). Use it from both
`resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx:130-156` and
`resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx:67-93`, deleting the
duplicated `#renderPager` bodies.

### Step 6 — Extract shared poll option-row components

Extract a `RemovableOptionRow` (or `PollOptionRow`) component parameterized by
id-prefix/value/onChange/onRemove/testId, and a `PollTypeRadioGroup` component for the
single/multiple radio pair. Place them under the resource(s) that use them, or
`common/misc/` if genuinely shared between `game` and `game_session` (per `frontend.md`'s
"Pages vs Elements" rule — grep importers before deciding). Use both from
`resources/game/pages/helpers/GamePollNewHelper.jsx:92-115,129-154` and
`resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx:67-89,91-116`.

### Step 7 — Consolidate per-field form state

Introduce a shared `useFormState(initial)` hook (e.g.
`common/base/hooks/useFormState.js` or similar existing hooks location — check for a
`hooks/` convention in `common/` before creating a new one) returning `{ state, handleChange }`,
consolidating the many independent `useState` calls into one state object per page. Apply it
first to the two clearest/largest cases:
- `resources/character/pages/shared/CharacterEdit.jsx:20-97` (18 `useState` calls, 3 modal flags)
- `resources/character/pages/GameNpcNew.jsx:13-24` (12 `useState` calls)

then to the remaining echoes of the same pattern: `GameEdit.jsx`, `GameTreasureEdit.jsx`,
`TreasureEdit.jsx`, `GameSessionEdit.jsx`, `MyAccount.jsx`, `StaffUserEdit.jsx`, `Register.jsx`
(exact paths under each resource's `pages/`). For `CharacterEdit.jsx` specifically, this also
addresses the issue's "component too big" concern by moving field state/handlers out of the
component and into the hook, leaving the component to call the hook and delegate to the
existing helper for rendering.

### Step 8 — Move `TreasureExchangeModal` orchestration into its controller

Move the browse/search/debounce/tab/confirm state machine (7 `useState`, 2 `useEffect` with a
debounce-guard ref, `loadPage`/`handleConfirm` closures) out of
`resources/character/pages/elements/TreasureExchangeModal.jsx:90-204` and into
`TreasureExchangeModalController` (`resources/character/pages/elements/controllers/TreasureExchangeModalController.js`),
matching the `Controller.buildEffect()`-owns-orchestration pattern used elsewhere. The
component should end up only wiring props/handlers from the controller to the existing helper.

### Step 9 — Move `GameSession` message-post flow into `SessionMessagesController`

Move the message-post request (fetch → check `response.ok` → parse errors → clear + reload)
out of `resources/game_session/pages/GameSession.jsx:56-71`'s `handleSubmit` and into
`SessionMessagesController` as a `postMessage(gameSlug, sessionId, token, content, setters)`
method (or equivalent), matching the pattern used by `GameSessionController` in the same file.
Use Step 1's `parseJsonOrReject` helper here too, since this flow currently repeats that idiom.

### Step 10 — Extract `#renderAllegianceSelect` in `BaseCharacterEditHelper`

In `resources/character/pages/helpers/BaseCharacterEditHelper.jsx:150-191`, extract a private
`#renderAllegianceSelect(id, label, value, onChange)` method (the `<select>` + 3 hardcoded
`<option>` values for ally/enemy/neutral), and call it twice from `#renderAllegianceFields`
instead of duplicating both `<select>` blocks.

## Files to Change

- `frontend/assets/js/utils/http/parseJsonOrReject.js` — new shared HTTP response helper (Step 1)
- `frontend/assets/js/utils/access/store/AccessStorePermissions.js`, `AccessStoreAccess.js`, `AccessStoreAdmin.js` — use the new helper (Step 1)
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js` — use the new helper, remove `#redirectToGame` (Steps 1, 2)
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollsController.js` — remove `#redirectToGame` (Step 2)
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js` — remove `#redirectToGame` (Step 2)
- `frontend/assets/js/components/resources/game/pages/elements/controllers/PollCloseModalController.js` — use the new helper (Step 1)
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js` — use the new helper (Step 1)
- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUserController.js` — use the new helper (Step 1)
- `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js` — use the new helper (Step 1)
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureController.js` — use the new helper (Step 1)
- `frontend/assets/js/components/common/base/controllers/BaseEditController.js` — use the new helper (Step 1)
- `frontend/assets/js/components/common/base/controllers/BasePageController.js` — add `redirectTo(hash)` (Step 2)
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — single `buildReadOnlyActionBarProps`, new `fetchPermissionGatedIndex` helper usage (Steps 3, 4)
- `frontend/assets/js/components/common/list_types/configs/characterListTypes.js` — import shared `buildReadOnlyActionBarProps`, use `fetchPermissionGatedIndex` (Steps 3, 4)
- `frontend/assets/js/components/common/list_types/configs/characterTreasureListTypes.js` — same as above (Steps 3, 4)
- `frontend/assets/js/components/common/list_types/fetchPermissionGatedIndex.js` — new shared helper (Step 4)
- `frontend/assets/js/components/common/pagination/BrowsePager.jsx` — new shared pager component (Step 5)
- `frontend/assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx` — use `BrowsePager` (Step 5)
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx` — use `BrowsePager` (Step 5)
- New `RemovableOptionRow`/`PollOptionRow` and `PollTypeRadioGroup` components (location TBD per importer check) (Step 6)
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollNewHelper.jsx` — use the new poll row/radio components (Step 6)
- `frontend/assets/js/components/resources/game_session/pages/elements/helpers/CreateSessionPollModalHelper.jsx` — same as above (Step 6)
- New `useFormState` hook (location TBD per existing hooks convention) (Step 7)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx` — use `useFormState` (Step 7)
- `frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx` — use `useFormState` (Step 7)
- `GameEdit.jsx`, `GameTreasureEdit.jsx`, `TreasureEdit.jsx`, `GameSessionEdit.jsx`, `MyAccount.jsx`, `StaffUserEdit.jsx`, `Register.jsx` (each under its resource's `pages/`) — use `useFormState` (Step 7)
- `frontend/assets/js/components/resources/character/pages/elements/TreasureExchangeModal.jsx` — remove inlined state machine (Step 8)
- `frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js` — absorb the state machine (Step 8)
- `frontend/assets/js/components/resources/game_session/pages/GameSession.jsx` — remove inlined `handleSubmit` fetch logic (Step 9)
- `SessionMessagesController` (same resource) — absorb `postMessage` (Step 9)
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx` — extract `#renderAllegianceSelect` (Step 10)
- Corresponding spec files under `frontend/specs/` mirroring every file above — update existing specs for moved logic, add new specs for newly extracted units (helper, hook, components)

## CI Checks

- `frontend`: `cd frontend && npm run coverage` and `npm run lint` (CI jobs: `jasmine`, `frontend-checks`)

## Notes

- No behavior changes are expected anywhere in this plan — every step is a pure extraction/consolidation. If any step reveals an actual behavioral discrepancy between duplicated call sites (e.g. slightly different error messages or edge-case handling), preserve the existing behavior of each call site rather than silently unifying it, and flag the discrepancy in the PR description.
- Step 6 and Step 7's new shared components/hooks need a placement decision (resource-specific vs. `common/`) per `frontend.md`'s "Pages vs Elements" rule — grep actual importers before finalizing the location.
- Per `docs/agents/contributing.md`, keep this as a refactor-only PR — do not mix in unrelated feature or bugfix commits.
