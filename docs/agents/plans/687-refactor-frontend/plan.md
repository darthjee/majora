# Plan: Refactor Frontend

Issue: [687-refactor-frontend.md](../../issues/687-refactor-frontend.md)

## Overview

Apply 21 targeted, behavior-preserving refactors across `frontend/assets/js/`, grouped into four categories: extracting duplicated logic into shared utilities, naming inline anonymous callbacks, splitting oversized render/build methods, and simplifying loops that mix multiple responsibilities. All work is frontend-only. No API or product behavior changes — every step should be covered by existing Jasmine specs continuing to pass, with new/updated specs added for any newly extracted unit.

## Context

A codebase scan (documented in the issue) found 21 concrete candidates. Several fixes reinforce each other (e.g. the shared `getCurrentHash()` utility resolves both a repetition case and an anonymous-function case; the `FILTER_KEYS` loop fix resolves both a "method too big" case and a "loop" case), so the steps below are ordered to build shared utilities first, then consume them.

## Implementation Steps

### Step 1 — Shared routing/hash utility

Extract `frontend/assets/js/utils/routing/currentHash.js` exporting `getCurrentHash()` (the SSR-safe `typeof window === 'undefined' ? '' : window.location.hash` expression). Replace all ~38 duplicated inline occurrences (`client/GenericClient.js:18`, `utils/routing/HashRouteResolver.js:17`, and the `pages/*.jsx` / `pages/controllers/*.js` files that repeat it) with imports of this function, including the two anonymous default-parameter declarations in `GenericClient.js:18` and `HashRouteResolver.js:17` that currently redefine it inline. Add a spec for `currentHash.js` covering both the browser and SSR (`window === undefined`) branches.

### Step 2 — Shared positive-int parsing utility

Extract `frontend/assets/js/utils/parsePositiveInt.js` (parse with `Number.parseInt(value, 10)`, fall back to a default when `NaN` or below a minimum bound). Replace the 8 duplicated implementations: `client/GenericClient.js:138-141`, `GameTasksController.js:231-234`, `GamePollsController.js:136-139`, `OpenPollsWidgetController.js:66-69` (currently uses `< 0` instead of `< 1` — reconcile this divergence explicitly with whoever owns pagination behavior, or default to the majority `< 1` bound unless a spec proves `< 0` was intentional), `StaffUsersController.js:139-142`, `TreasureExchangeModalController.js:19-22`, `AddGameTreasureModalController.js:13-16`, `PaginationHelper.jsx:62-65`. Add a spec covering valid input, `NaN` input, and below-bound input.

### Step 3 — Shared JSON response helper

Add `parseJsonOrReject(response, message)` to `BaseClient` (or an adjacent shared client util) implementing `response.ok ? response.json() : Promise.reject(new Error(message))`. Replace the ~11 duplicated inline ternaries in `GamePollController.js`, `PollCloseModalController.js`, `GameSessionController.js`, `StaffUserController.js`, `MyAccountController.js`, `TreasureController.js`, and `BaseEditController.js`. Add/extend `BaseClient` specs to cover both branches.

### Step 4 — Shared filtered-href builder

Extract `buildFilteredHref(basePath, filters)` (resets to page 1, applies filters via `URLSearchParams`) into a shared utils module. Replace the 5 duplicated implementations in `GameTreasures.jsx`, `GameNpcs.jsx`, `CharacterTreasures.jsx`, `Treasures.jsx`, and `GamePollsController.js`. Add a spec covering the page-reset and filter-serialization behavior.

### Step 5 — Shared pager component

Extract a reusable `<BrowsePager browse={...} onPrev={...} onNext={...} />` component from the byte-identical `#renderPager` blocks in `TreasureExchangeModalHelper.jsx:130-156` and `AddGameTreasureModalHelper.jsx:67-93`. Update both helpers to use it. Add/adapt a spec for the new component; existing helper specs should continue to pass unchanged in behavior.

### Step 6 — Shared filter-query builder

Extract a generic filter-query-builder (draft-state → sparse query object, keyed by field name) used by `NpcFiltersController.js:118-153`, `TreasureFiltersController.js:70-104`, and `PollFiltersController.js:30-42`. Each controller supplies its own field list; the shared piece owns the "omit blank fields" logic. Add a spec for the shared builder and keep each controller's existing specs green.

### Step 7 — Shared client query-param builder

Add a `buildQuery(params)` helper to `BaseClient` that sets only defined `URLSearchParams` entries. Replace the duplicated inline builders in `TreasureClient.js` (`fetchGameTreasuresPage` / `fetchGameTreasuresAllPage`) and `CharacterClient.js` (`fetchTreasuresPage` / `fetchTreasuresAllPage`). Extend `BaseClient` specs to cover the helper directly.

### Step 8 — Name inline anonymous handlers

- `HeaderHelper.jsx:171-174`: replace the inline `onClick={(event) => {...}}` with a named `HeaderController#handleViewAsClick(event)` method passed as the prop.
- `HeaderController.js:114-132`: extract the 18-line anonymous `async () => {...}` passed to `setInterval` in `startHealthCheck()` into a private `#pollHealth()` method; pass `() => this.#pollHealth()`.
- `GameNpcs.jsx:41-47,64-70`: name the shared `() => { setTarget(null); refresh(); }` callback (e.g. `handleToggled`) in both `useSlainTogglePair`/`usePlayerSlainTogglePair` hooks, and evaluate unifying the two near-duplicate hooks around one parameterized helper if it doesn't reduce clarity.

Update the relevant `HeaderHelper`/`HeaderController`/`GameNpcs` specs to assert on the named methods where useful; behavior must stay identical.

### Step 9 — Fix the CoinBreakdown map/mutation (anonymous function + loop)

`utils/money/CoinBreakdown.js:80-103`: `#buildEntries()`'s `.map()` callback branches on "is this the last denomination", performs cascade arithmetic, and mutates the outer `remaining` accumulator as a side effect — covering both the anonymous-function and loop-complexity findings for this file. Replace with an explicit loop or `.reduce()` where the carried `remaining` state is passed through the accumulator signature rather than closed over. Keep `CoinBreakdown`'s public output identical; extend its spec with cases that pin down cascade behavior across denominations (including the last-denomination branch) to guard against regressions during the rewrite.

### Step 10 — Split `GameNpcNewHelper.render()`

`GameNpcNewHelper.jsx:33-139` (107 lines): split into `#renderAvatarColumn`, `#renderDetailsColumn`, and `#renderAllegianceFields`, mirroring the existing split in `BaseCharacterEditHelper`. Keep the rendered markup/output unchanged; existing helper specs should continue to pass.

### Step 11 — Split `NpcFiltersHelper.render()`

`NpcFiltersHelper.jsx:19-92` (74 lines): extract a small reusable `<FilterSelect id label value options onChange />` element and use it for the status, allegiance, and any other simple `<select>` filter controls (the Hidden dropdown is already factored into `#renderHiddenFilter` — follow that precedent). Add a spec for `FilterSelect` and keep `NpcFiltersHelper`'s existing spec green.

### Step 12 — Data-driven `HashRouteResolver` (methods too big + loop)

`utils/routing/HashRouteResolver.js`:
- `getFilterParams()` (lines 122-168): replace the 8 near-identical "read query key, conditionally set" blocks with a loop over a `FILTER_KEYS` array (`['slain', 'name', 'allegiance', 'status', 'hidden', 'game_type', 'min_value', 'max_value']`).
- Constructor (lines 17-62): replace the 40 hand-unrolled `this.#router.register(path, key)` calls with a static `ROUTES` table (array of `[path, key]` pairs) registered via a loop.

These two changes resolve both the "methods too big" and "loops" findings for this file. Keep route registration order and filter-param behavior identical; existing `HashRouteResolver` specs must continue to pass without modification (a strong sign the refactor is behavior-preserving), and add a spec asserting `FILTER_KEYS`/`ROUTES` stay in sync with the resolver's public behavior if not already covered.

### Step 13 — Split `TreasureExchangeModalHelper#renderDetail()`

`TreasureExchangeModalHelper.jsx:202-247` (46 lines): extract the tab-dependent value resolution (`treasureId`, `owned`, `maxQuantity`) into a separate helper/controller method, leaving `#renderDetail` purely presentational (image, quantity form, confirm button). Add a spec for the extracted resolver function; keep the existing modal spec green.

### Step 14 — `GamePollHelper#buildVoteMaps()` and shared `groupBy`

`GamePollHelper.jsx:136-149`: extract a small `groupBy(items, keyFn)` utility (likely in `utils/`) to replace the manual get→push→set loop building `voterIdsByOption`. Split `#buildVoteMaps()` into three focused builders (`usersById`, `countsByOption`, `voterIdsByOption`) composed together, rather than one method doing all three. Add a spec for `groupBy` and keep `GamePollHelper`'s existing specs green.

### Step 15 — Shared `fetchWithEditableEndpoint` for list-type configs

`components/common/list_types/configs/characterListTypes.js:45-59` (`fetchNpcs`) and `characterTreasureListTypes.js:72-85` (`fetchNpcTreasuresList`): extract a shared `fetchWithEditableEndpoint(gameSlug, base, filterParams, client)` helper that resolves permissions, picks the endpoint, fetches, and reshapes the response (`{data, pagination, canEdit}`) once, used by both config files. Add a spec for the shared helper and keep both list-type config specs green.

## Files to Change

- `frontend/assets/js/utils/routing/currentHash.js` — new shared hash-reading utility (Step 1)
- `frontend/assets/js/utils/parsePositiveInt.js` — new shared int-parsing utility (Step 2)
- `frontend/assets/js/client/BaseClient.js` — add `parseJsonOrReject` (Step 3) and `buildQuery` (Step 7)
- `frontend/assets/js/utils/routing/buildFilteredHref.js` (or similar) — new shared href builder (Step 4)
- `frontend/assets/js/components/common/*/BrowsePager.jsx` (new) — shared pager component (Step 5)
- `frontend/assets/js/utils/filters/` (new shared filter-query builder) (Step 6)
- `frontend/assets/js/client/GenericClient.js`, `client/TreasureClient.js`, `client/CharacterClient.js` — consume Steps 1, 2, 7
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — Steps 1, 12
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js`, `GamePollsController.js` — Steps 1, 2, 4
- `frontend/assets/js/components/resources/game/pages/elements/controllers/OpenPollsWidgetController.js` — Step 2
- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js`, `StaffUserController.js` — Steps 2, 3
- `frontend/assets/js/components/resources/character/pages/elements/controllers/TreasureExchangeModalController.js`, `NpcFiltersController.js` — Steps 2, 6
- `frontend/assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js`, `TreasureFiltersController.js` — Steps 2, 6
- `frontend/assets/js/components/common/pagination/helpers/PaginationHelper.jsx` — Step 2
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js`, `elements/controllers/PollCloseModalController.js`, `elements/controllers/PollFiltersController.js` — Steps 3, 6
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js` — Step 3
- `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js` — Step 3
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureController.js` — Steps 3, 4
- `frontend/assets/js/components/common/base/controllers/BaseEditController.js` — Step 3
- `frontend/assets/js/components/resources/treasure/pages/GameTreasures.jsx`, `Treasures.jsx` — Step 4
- `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx`, `shared/CharacterTreasures.jsx` — Steps 4, 8
- `frontend/assets/js/components/resources/character/pages/elements/helpers/TreasureExchangeModalHelper.jsx`, `NpcFiltersHelper.jsx`, `GameNpcNewHelper.jsx` — Steps 5, 11, 10, 13
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/AddGameTreasureModalHelper.jsx` — Step 5
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`, `controllers/HeaderController.js` — Step 8
- `frontend/assets/js/utils/money/CoinBreakdown.js` — Step 9
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx` — Step 14
- `frontend/assets/js/utils/` — new `groupBy.js` (Step 14)
- `frontend/assets/js/components/common/list_types/configs/characterListTypes.js`, `characterTreasureListTypes.js` — Step 15
- `frontend/specs/` — new and updated Jasmine specs mirroring every file above

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — runs the Jasmine spec suite; every extracted utility/component needs coverage here
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — no translation keys are expected to change, but this job runs regardless

## Notes

- Purely internal refactor: no behavior, API, or UI change is expected in any step. Each step should be verifiable by existing specs continuing to pass plus new specs for newly extracted units.
- Step 2 surfaces one real behavioral inconsistency (`OpenPollsWidgetController.js` using `< 0` instead of `< 1`) — flag this explicitly during implementation/review rather than silently picking one bound.
- Steps are largely independent and can be implemented/reviewed in separate PRs by category (repetition: Steps 1-7; anonymous functions: Step 8; methods too big: Steps 10-13; loops: Steps 9, 14-15 — several steps like 9 and 12 span two categories), per the issue's scope decision to keep planning consolidated but allow split PRs.
- Given the number of files touched (~30+), run `npm run lint` and `npm run coverage` after each step (or small group of steps) rather than only at the end, to catch regressions early.
