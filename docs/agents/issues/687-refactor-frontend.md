# Issue: Refactor Frontend

## Description

Improve frontend code quality by refactoring a curated set of concrete, low-risk cases identified across `frontend/assets/js/`. A codebase scan turned up 21 candidates spread across four categories:

- **Code repetition** — logic copy-pasted across multiple files/components instead of shared.
- **Anonymous functions** — inline callbacks that obscure intent or duplicate logic that should be named/extracted.
- **Methods too big** — render/build methods doing too much in one place.
- **Loops with too many steps** — loop bodies mixing multiple responsibilities (branching, arithmetic, side-effect mutation).

Each case below improves readability/maintainability without changing behavior. All 21 cases are tracked under this single issue; implementation may still be split into multiple PRs by category if that's more reviewable, but planning stays consolidated here. No files/areas are excluded from scope.

## Solution

### Code repetition

1. `typeof window === 'undefined' ? '' : window.location.hash` duplicated verbatim in ~38 places (e.g. `client/GenericClient.js:18`, `utils/routing/HashRouteResolver.js:17`, many `pages/*.jsx` and `pages/controllers/*.js` files). Extract a shared `utils/routing/currentHash.js` (`getCurrentHash()`).
2. Positive-int-parsing fallback (`Number.parseInt` + NaN/bound check) reimplemented in 8 files (`client/GenericClient.js:138-141`, `GameTasksController.js:231-234`, `GamePollsController.js:136-139`, `OpenPollsWidgetController.js:66-69`, `StaffUsersController.js:139-142`, `TreasureExchangeModalController.js:19-22`, `AddGameTreasureModalController.js:13-16`, `PaginationHelper.jsx:62-65`) — one variant already diverges (`< 0` vs `< 1`). Extract `utils/parsePositiveInt.js`.
3. `response.ok ? response.json() : Promise.reject(...)` idiom repeated ~11 times across `GamePollController.js`, `PollCloseModalController.js`, `GameSessionController.js`, `StaffUserController.js`, `MyAccountController.js`, `TreasureController.js`, `BaseEditController.js`. Add a `parseJsonOrReject(response, message)` helper to `BaseClient`.
4. "Reset to page 1 and apply filters" href-builder duplicated in 5 files (`GameTreasures.jsx:15-16`, `GameNpcs.jsx:25-26`, `CharacterTreasures.jsx:19-20`, `Treasures.jsx:17-18`, `GamePollsController.js:36-37`). Extract `buildFilteredHref(basePath, filters)`.
5. `#renderPager` JSX block duplicated byte-for-byte between `TreasureExchangeModalHelper.jsx:130-156` and `AddGameTreasureModalHelper.jsx:67-93`. Extract a reusable `<BrowsePager />` component.
6. Filters-controller "draft-state → sparse query object" pattern reimplemented per-resource in `NpcFiltersController.js:118-153`, `TreasureFiltersController.js:70-104`, `PollFiltersController.js:30-42`. Extract a generic filter-query-builder.
7. Optional-query `URLSearchParams` builder duplicated within `TreasureClient.js` (`fetchGameTreasuresPage` vs `fetchGameTreasuresAllPage`) and within `CharacterClient.js` (`fetchTreasuresPage` vs `fetchTreasuresAllPage`). Extract `buildQuery(params)` on `BaseClient`.

### Anonymous functions

1. `HeaderHelper.jsx:171-174` — inline `onClick={(event) => { event.preventDefault(); handlers.onViewAsClick(); }}`. Move to a named `HeaderController#handleViewAsClick(event)`.
2. `HeaderController.js:114-132` — `startHealthCheck()` passes an 18-line anonymous async callback to `setInterval`. Extract a private `#pollHealth()` method.
3. `GameNpcs.jsx:41-47,64-70` — two near-duplicate hooks each build an inline `() => { setTarget(null); refresh(); }` success callback. Name the callback and/or unify the two hook variants.
4. `utils/money/CoinBreakdown.js:83-96` — `.map()` callback mutates an outer `remaining` variable as a side effect instead of being a pure transform. Replace with an explicit loop/`reduce()` (pairs with the loop item below).
5. `client/GenericClient.js:18` and `utils/routing/HashRouteResolver.js:17` both declare the identical anonymous default parameter for reading the current hash. Reuse the shared `getCurrentHash()` utility from repetition item 1.

### Methods too big

1. `GameNpcNewHelper.jsx:33-139` — `static render()` is 107 lines of unextracted form markup. Split into `#renderAvatarColumn`/`#renderDetailsColumn`/`#renderAllegianceFields`, mirroring `BaseCharacterEditHelper`.
2. `NpcFiltersHelper.jsx:19-92` — `static render()` is 74 lines building 5 filter controls inline. Extract a reusable `<FilterSelect id label value options onChange />`.
3. `HashRouteResolver.js:122-168` — `getFilterParams()` is 47 lines of 8 near-identical "read query key, conditionally set" blocks. Replace with a loop over a `FILTER_KEYS` array.
4. `HashRouteResolver.js:17-62` — constructor body is 40 near-identical hand-unrolled `this.#router.register(path, key)` calls. Move to a static `ROUTES` table registered in a loop.
5. `TreasureExchangeModalHelper.jsx:202-247` — `#renderDetail()` is 46 lines mixing tab-dependent value resolution with markup building. Extract value resolution into a separate helper/controller method.

### Loops have too many steps

1. `utils/money/CoinBreakdown.js:80-103` — `#buildEntries()`'s `.map()` callback branches, does cascade math, and mutates an outer accumulator all in one loop body. Extract into a dedicated reduce step or small stateful iterator.
2. `GamePollHelper.jsx:136-149` — `#buildVoteMaps()` builds three unrelated lookup maps in one method, including a manual "group by" loop. Extract a `groupBy(items, keyFn)` utility and split into focused builders.
3. `HashRouteResolver.js:122-168` — same method as above, structurally a hand-unrolled loop; same `FILTER_KEYS` loop fix applies.
4. `characterListTypes.js:45-59` (`fetchNpcs`) and `characterTreasureListTypes.js:72-85` (`fetchNpcTreasuresList`) — each `.then()` chain resolves permissions, picks an endpoint, fetches, and reshapes the response in one step, duplicated across both files. Extract a shared `fetchWithEditableEndpoint(gameSlug, base, filterParams, client)` helper.

## Benefits

- Removes ~10 instances of hand-duplicated logic (hash reading, int parsing, response parsing, query building) in favor of single shared utilities.
- Shrinks several 40-100+ line methods into smaller, single-responsibility pieces that are easier to read and test.
- Replaces hand-unrolled loops/conditionals with data-driven loops, reducing the chance of copy-paste drift (already seen in the int-parsing bound mismatch).
- No behavior change — pure internal quality improvement.
