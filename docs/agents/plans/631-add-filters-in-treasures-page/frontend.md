# Frontend Plan: Add filters in treasures page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the `GET /treasures.json` query params documented in [plan.md](plan.md)'s "Shared contracts" section — must send `game_type`, `min_value`, `max_value`, `name` exactly, with blank/unset fields omitted from the query entirely (not sent as empty strings), matching how `NpcFiltersController.buildQuery` already omits blank fields.

Consumes the `treasures_page.filter_*` translation keys documented in [plan.md](plan.md), produced by [translator](translator.md).

## Implementation Steps

### Step 1 — Extend `HashRouteResolver.getFilterParams()`

In `frontend/assets/js/utils/routing/HashRouteResolver.js` (`getFilterParams()`, currently lines 119-150), add `game_type`, `min_value`, `max_value` alongside the existing `slain`/`name`/`allegiance`/`status`/`hidden` handling (`name` is already read — reuse it as-is). Update the method's JSDoc to list the three new params. This method is shared/generic across pages (already doubles as "NPC/poll filter params"), so no per-page branching is needed — it's just a wider fixed whitelist.

### Step 2 — New `TreasureFilters` element

Under `frontend/assets/js/components/resources/treasure/pages/elements/` (new `elements/` dir in the treasure pages folder — mirror `character/pages/elements/`), add three files mirroring `NpcFilters.jsx` / `NpcFiltersController.js` / `NpcFiltersHelper.jsx`:

- `elements/controllers/TreasureFiltersController.js` — manages draft state for `gameType`, `minValue`, `maxValue`, `name`. `buildQuery(gameType, minValue, maxValue, name)` returns `{game_type, min_value, max_value, name}` with blank fields omitted (mirror `NpcFiltersController.buildQuery`'s omit-blank pattern; trim `name`). `clear()` resets all four fields to blank. No status/enum mapping helpers are needed here (unlike `slainToStatus`/`hiddenToFilter`) since `game_type` maps 1:1 to the dropdown value.
- `elements/helpers/TreasureFiltersHelper.jsx` — renders a `data-testid="treasure-filters"` row (mirror `NpcFiltersHelper`'s Bootstrap `row g-2 align-items-end mb-4` layout): a Game type `<select data-testid="treasure-filter-game-type">` with a blank option plus `<option value="dnd">D&amp;D</option>`/`<option value="deadlands">Deadlands</option>` (literal text, matching `TreasureNewHelper.jsx`'s existing convention — not translated); a Min value `<input type="number" data-testid="treasure-filter-min-value">`; a Max value `<input type="number" data-testid="treasure-filter-max-value">`; a Name `<input type="text" data-testid="treasure-filter-name">`; Query and Clear buttons (`data-testid="treasure-filter-query"`/`"treasure-filter-clear"`). All labels/placeholder/button text via `Translator.t('treasures_page.filter_*')` (see [plan.md](plan.md)).
- `elements/TreasureFilters.jsx` — pre-populates draft state from `new HashRouteResolver().getFilterParams()` (mirror `NpcFilters.jsx`'s `useState` + `initialFilters.get(...)` pattern), takes `onQuery`/`onClear` props with the same shape as `NpcFilters` (`onQuery` called with the built query object, `onClear` called after resetting draft state).

### Step 3 — `TreasuresController` changes

In `frontend/assets/js/components/resources/treasure/pages/controllers/TreasuresController.js`:

- Add a `static buildFilterQueryHash(basePath, filters)` mirroring `GameNpcsController.buildFilterQueryHash` (`frontend/assets/js/components/resources/character/pages/controllers/GameNpcsController.js:32-35`): `new URLSearchParams({page: '1', ...filters}).toString()`, resetting pagination to page 1 whenever filters change.
- Add a `this.hashResolver = new HashRouteResolver(...)` field in the constructor (mirror `GameNpcsController`'s constructor), and in `buildEffect()`, read `const filterParams = Object.fromEntries(this.hashResolver.getFilterParams())` and pass it as the second argument to `this.client.fetchIndex('/treasures.json', filterParams)` (currently called with no second argument at line 65).

### Step 4 — `TreasuresHelper` changes

In `frontend/assets/js/components/resources/treasure/pages/helpers/TreasuresHelper.jsx`, extend `render(...)` to accept two more trailing params, mirroring `GameCharactersHelper.render`'s `extraParams`/`filters` params: `activeFilters = {}` and `filters = null`. Render `{filters}` just below `PageActions` (above the `.row` grid), and pass `extraParams={activeFilters}` to the existing `<Pagination>` call so active filters are preserved on every pagination link (mirror `GameCharactersHelper`'s `<Pagination extraParams={extraParams} .../>`).

### Step 5 — `Treasures.jsx` page wiring

In `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx`, mirror `GameNpcs.jsx`'s filter wiring:

- `const basePath = '#/treasures';`
- `const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());`
- `handleFilterQuery = (filters) => { window.location.hash = TreasuresController.buildFilterQueryHash(basePath, filters); controller.buildEffect()(); }`
- `handleFilterClear = () => { window.location.hash = basePath; controller.buildEffect()(); }`
- Pass `activeFilters` and `<TreasureFilters onQuery={handleFilterQuery} onClear={handleFilterClear} />` into `TreasuresHelper.render(...)`.

### Step 6 — Specs

- `frontend/specs/assets/js/utils/routing/HashRouteResolver` (find the existing `getFilterParams` spec) — add coverage for `game_type`/`min_value`/`max_value`.
- New specs mirroring the three `NpcFilters*Spec.js` files (`frontend/specs/assets/js/components/resources/character/pages/elements/NpcFiltersSpec.js` and its `controllers`/`helpers` siblings): `TreasureFiltersSpec.js`, `controllers/TreasureFiltersControllerSpec.js`, `helpers/TreasureFiltersHelperSpec.js`, under the mirrored `frontend/specs/.../treasure/pages/elements/` path.
- `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasuresControllerSpec.js` — add coverage for `buildFilterQueryHash` and for `fetchIndex` being called with filter params from the hash.
- `frontend/specs/assets/js/components/resources/treasure/pages/helpers/TreasuresHelperSpec.js` — add coverage for the new `filters`/`activeFilters` params (filters node rendered, `extraParams` passed to `Pagination`).
- `frontend/specs/assets/js/components/resources/treasure/pages/TreasuresSpec.js` — add coverage for the query/clear interaction updating `window.location.hash` and re-triggering the fetch, mirroring however the equivalent `GameNpcs` page-level spec covers `handleFilterQuery`/`handleFilterClear` (locate it under `frontend/specs/.../character/pages/GameNpcsSpec.js` or similar and follow the same assertion style).

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — extend `getFilterParams()`.
- `frontend/assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx` — new.
- `frontend/assets/js/components/resources/treasure/pages/elements/controllers/TreasureFiltersController.js` — new.
- `frontend/assets/js/components/resources/treasure/pages/elements/helpers/TreasureFiltersHelper.jsx` — new.
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasuresController.js` — add `buildFilterQueryHash`, wire filter params into `fetchIndex`.
- `frontend/assets/js/components/resources/treasure/pages/helpers/TreasuresHelper.jsx` — accept/render `filters`/`activeFilters`.
- `frontend/assets/js/components/resources/treasure/pages/Treasures.jsx` — wire filter state/handlers.
- Spec files listed in Step 6.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- The per-game treasures page (`GameTreasuresController`/`GameTreasuresHelper`/`GameTreasures.jsx`) already has a backend `max_value`/`search` filter capability that its frontend never wired up — that gap is pre-existing and out of scope for this issue, which only covers the top-level `/#/treasures` page.
- `GenericClient#fetchIndex(path, extraParams)` already merges `extraParams` over pagination params and ignores blank/undefined/null values, so no client changes are needed there.
