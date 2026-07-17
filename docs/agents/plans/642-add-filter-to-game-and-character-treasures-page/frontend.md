# Frontend Plan: Add filter to game and character treasures page

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on the backend (see [plan.md](plan.md) and [backend.md](backend.md)) accepting
`min_value`/`max_value`/`name` on:

- `GET /games/<slug>/treasures.json` and `GET /games/<slug>/treasures/all.json`
- `GET /games/<slug>/pcs/<id>/treasures.json`
- `GET /games/<slug>/npcs/<id>/treasures.json` and `GET /games/<slug>/npcs/<id>/treasures/all.json`

`search` stops being a valid param name on all of the above (renamed to `name`) — every
frontend call site sending `search` must switch to `name`. No page needs to send `game_type`.

## Implementation Steps

### Step 1 — Let `TreasureFilters` hide the game-type dropdown

`TreasureFilters.jsx` / `TreasureFiltersHelper.jsx` / `TreasureFiltersController.js`
(`frontend/assets/js/components/resources/treasure/pages/elements/`) already implement
exactly the fields needed (game type, min value, max value, name) and are reused as-is per
the issue discussion. Add a prop, e.g. `showGameType = true`, threaded through
`TreasureFilters` → `TreasureFiltersHelper.render`, so the three scoped pages can render it
with `showGameType={false}`:

- `TreasureFiltersHelper.render` conditionally skips the game-type `<div className="col-auto">`
  block when `showGameType` is false.
- `TreasureFiltersController#buildQuery` already omits `game_type` whenever `gameType === ''`
  (line 74 of `TreasureFiltersController.js`) — when `showGameType` is false, simply never
  initialize/pass a non-blank `gameType`, so no controller change is needed; only the render
  helper needs the flag to skip the DOM/label.
- Existing `Treasures.jsx` usage keeps `showGameType` defaulted to `true` — no change needed
  there.

### Step 2 — Wire `TreasureFilters` into `GameTreasures.jsx`

`GameTreasures.jsx` (`frontend/assets/js/components/resources/treasure/pages/`) currently has
no filter UI and its controller doesn't forward hash filter params to either backend variant
it calls. Following the exact pattern already used in `Treasures.jsx`
(`onQuery`/`onClear` handlers rewriting `window.location.hash` via
`TreasuresController.buildFilterQueryHash`, then re-running the effect):

- Render `<TreasureFilters onQuery={handleFilterQuery} onClear={handleFilterClear} showGameType={false} />`
  above the treasures grid (`GameTreasuresHelper.render` gains a slot for it, same as
  `TreasuresHelper.render` already does for the global page).
- In `GameTreasuresController.js`, update `#fetchTreasures` (both the `treasures/all.json` and
  `treasures.json` branches inside `#loadTreasures`/`#fetchTreasures`) to pass
  `Object.fromEntries(new HashRouteResolver().getFilterParams())` as `fetchIndex`'s
  `extraParams` — same one-line change as `TreasuresController.buildEffect` already does at
  line 81 of `TreasuresController.js`. `getFilterParams()` already returns `name`/`min_value`/
  `max_value` (and `game_type`, unused here since the UI never sets it) with no changes needed
  to `HashRouteResolver` itself.

### Step 3 — Wire `TreasureFilters` into the shared `CharacterTreasures.jsx` (PC + NPC)

`CharacterTreasures.jsx` (`frontend/assets/js/components/resources/character/pages/shared/`)
is shared by both `PcCharacterTreasuresController`/`NpcCharacterTreasuresController`. Same
approach as Step 2:

- Render `<TreasureFilters onQuery={...} onClear={...} showGameType={false} />` above the grid
  in `CharacterTreasuresHelper.render` (or directly in `CharacterTreasures.jsx`, whichever
  keeps `CharacterTreasuresHelper` focused on pure rendering, matching its current
  convention).
- `BaseCharacterTreasuresController.js`:
  - `#fetchTreasuresIndex` (the plain PC/NPC path, `client.fetchIndex(...)`) needs the same
    one-line `extraParams` addition as Step 2.
  - `#fetchNpcTreasuresAll` (the DM "all" path, going through `CharacterClient
    #fetchTreasuresAllPage` instead of the generic client) currently only threads `page`/
    `perPage` through `#paginationParamsFromHash`; extend it (or add a sibling helper) to also
    read `name`/`min_value`/`max_value` from `HashRouteResolver#getFilterParams()` and pass
    them into `fetchTreasuresAllPage`'s options object.
  - `CharacterClient#fetchTreasuresAllPage` (`frontend/assets/js/client/CharacterClient.js`,
    ~line 205) currently accepts `{ page, perPage, search }` and sends `search` as the query
    param name; change it to accept/send `name` instead, and add `min_value`/`max_value`
    pass-through the same way `search` is handled today.
- Hash-based filter/query building (rewriting `window.location.hash` on Query/Clear) should
  reuse the same pattern as `Treasures.jsx`'s `handleFilterQuery`/`handleFilterClear`, scoped
  to each page's own `basePath` (already computed in `CharacterTreasures.jsx` as
  `#/games/${gameSlug}/${characterKind}/${characterId}/treasures`).

### Step 4 — Tests

- `frontend/specs/.../elements/helpers/TreasureFiltersHelperSpec.js` (if it exists, otherwise
  add it) — cover `showGameType={false}` hiding the dropdown.
- `frontend/specs/assets/js/components/resources/treasure/pages/GameTreasuresSpec.js` and its
  `controllers/GameTreasuresController` spec dir — cover filter params being forwarded to both
  `fetchIndex` calls.
- `frontend/specs/assets/js/components/resources/character/pages/CharacterTreasuresSpec.js`
  and any `BaseCharacterTreasuresController`/`PcCharacterTreasuresController`/
  `NpcCharacterTreasuresController` spec files — cover filter params on all three fetch paths
  (`fetchIndex` for PC, `fetchIndex` for NPC non-editor, `fetchTreasuresAllPage` for NPC
  editor).
- `frontend/specs/assets/js/client/CharacterClient/` — add/update a spec for
  `fetchTreasuresAllPage` sending `name` instead of `search`, plus `min_value`/`max_value`.

## Files to Change

- `frontend/assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx`,
  `.../elements/helpers/TreasureFiltersHelper.jsx` — add `showGameType` prop.
- `frontend/assets/js/components/resources/treasure/pages/GameTreasures.jsx`,
  `.../helpers/GameTreasuresHelper.jsx`, `.../controllers/GameTreasuresController.js` — render
  filters, forward filter params to both fetch branches.
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`,
  `.../helpers/CharacterTreasuresHelper.jsx`,
  `.../controllers/BaseCharacterTreasuresController.js` — render filters, forward filter
  params to all three fetch paths.
- `frontend/assets/js/client/CharacterClient.js` — `fetchTreasuresAllPage`: `search` → `name`,
  add `min_value`/`max_value`.
- Spec files listed in Step 4.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).

## Notes

- No new translation keys are needed — `TreasureFilters` reuses the existing
  `treasures_page.filter_*` i18n keys as-is; the `translator` agent has no work here.
- Coordinate the `search` → `name` param rename with the backend agent (see
  [backend.md](backend.md)) so both sides land together.
