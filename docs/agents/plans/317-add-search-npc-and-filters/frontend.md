# Frontend Plan: Add search NPC and filters

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend now accepts, on both `/games/:game_slug/npcs.json` and
  `/games/:game_slug/npcs/all.json`, two optional query params on top of existing
  pagination: `slain` (`"true"`/`"false"`) and `name` (case-insensitive substring). Absent
  or blank means "not applied". Response shape/headers unchanged.
- The frontend must route both filters through the existing hash-URL query-string
  mechanism, the same way `page`/`per_page` already work, and must send them regardless of
  which of the two endpoints ends up being used (role-based routing in
  `GameNpcsController` is unchanged).
- New i18n keys under `game_npcs_page` (added by `translator`): `filter_status_label`,
  `filter_status_alive`, `filter_status_slain`, `filter_name_label`,
  `filter_name_placeholder`, `filter_query`, `filter_clear`.

## Implementation Steps

### Step 1 — Extend `HashRouteResolver` to read/write filter params

In `frontend/assets/js/utils/HashRouteResolver.js`, add a method alongside
`getPaginationParams()`, e.g. `getFilterParams()`, that reads `slain` and `name` from the
current hash's query string (via `HashQueryParams.parse`) the same way `getPaginationParams`
reads `page`/`per_page` — only set on the returned `URLSearchParams` when present in the
hash. Keep `getPaginationParams()` itself untouched so other pages/tests are unaffected.

### Step 2 — Extend `GenericClient.fetchIndex` / `CharacterClient.fetchNpcsAll` calls to include filters

- `GameNpcsController#fetchNpcs` currently builds `paginationParams` from
  `this.hashResolver.getPaginationParams()` for the admin (`fetchNpcsAll`) call, and relies
  on `this.client.fetchIndex(...)` (which internally uses its own resolver's
  `getPaginationParams()`) for the public call. Extend both paths to also include the new
  filter params:
  - For the admin path: merge `getFilterParams()` into the params object passed to
    `characterClient.fetchNpcsAll(gameSlug, token, { ...paginationParams, ...filterParams })`.
  - For the public path: `GenericClient.fetchIndex` builds its URL from
    `this.#resolver.getPaginationParams()` only — either extend `fetchIndex` to also merge in
    filter params (check other callers of `fetchIndex` first, e.g. `GamePcsController`/game
    list controllers, to confirm none would unintentionally start sending `slain`/`name` —
    if any could, prefer a new explicit method or an optional params argument on `fetchIndex`
    instead of silently expanding its default behavior), or build the query directly in
    `GameNpcsController` alongside the existing `this.client.fetchIndex(...)` call. Favor
    minimal blast radius: only NPCs should ever send these two params.

### Step 3 — Build the `NpcFilters` element (component + controller + helper trio)

Follow the existing `elements/<Name>.jsx` + `elements/controllers/<Name>Controller.js` +
`elements/helpers/<Name>Helper.jsx` pattern (see `LanguageSelector.jsx` /
`LanguageSelectorController.js` / `LanguageSelectorHelper.jsx` for reference):

- `frontend/assets/js/components/elements/NpcFilters.jsx` — function component holding local
  state for the two draft field values (`status`, `name`), initialized from
  `HashRouteResolver#getFilterParams()` via props/controller so deep-linked URLs pre-populate
  the fields.
- `frontend/assets/js/components/elements/controllers/NpcFiltersController.js` — translates
  the Status dropdown's three options (blank / Alive / Slain) to/from the `slain` query value
  (`""` / `"false"` / `"true"`), builds the query object for the Query button (`slain`,
  `name` — both omitted when blank), and provides a `clear()` that resets to blank.
- `frontend/assets/js/components/elements/helpers/NpcFiltersHelper.jsx` — renders: a `Status`
  `<select>` (`form-select`, matching the `LanguageSelectorHelper` styling convention), a
  `Name` text `<input>`, a `Query` button, and a `Clear` button, using `Translator.t(...)`
  for all labels (see Step in `translator.md` for the exact keys).

### Step 4 — Wire `NpcFilters` into `GameNpcs.jsx` / `GameNpcsController`

- Render `<NpcFilters .../>` in `frontend/assets/js/components/pages/GameNpcs.jsx`, above
  `GameCharactersHelper.render(...)`'s output (below the header/back/new buttons, per the
  issue) — likely easiest by adding a small wrapper inside `GameNpcs.jsx` itself rather than
  changing `GameCharactersHelper.render`'s shared signature (that helper is also used by
  `GamePcs`, which does not get filters per this issue).
- On "Query": update the hash URL query string (via the existing pattern used for pagination
  navigation — check how pagination currently triggers URL changes, likely through anchor
  navigation via `PageLink`/`Pagination`, vs. this being a button click that must
  programmatically set `window.location.hash`) to include `page=1` (reset pagination) plus
  the active `slain`/`name`, then re-run `controller.buildEffect()()` (same refresh pattern
  already used after upload/slain success in `GameNpcs.jsx`).
- On "Clear": reset the URL query string to drop `slain`/`name` (keep `page`/`per_page` reset
  to defaults or drop entirely — match "Clear... immediately re-fetches the unfiltered list"
  from the issue) and re-fetch.
- `GameNpcsController#fetchNpcs` must re-read filter params from the hash on every effect run
  (it already re-reads pagination params this way), so no controller constructor changes are
  needed beyond Step 2's param merging.

### Step 5 — Extend `PaginationHelper` to preserve active filters

In `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx`, the
`linkTemplate` is currently hardcoded to `` `${basePath}?page=:page&per_page=:perPage` ``.
Extend `PaginationHelper.render(...)` to accept an optional extra-params argument (e.g. an
object or `URLSearchParams` of already-active filters) and append them to `linkTemplate`
(and to `PageLink`'s substitution) so filtered pagination links keep `slain`/`name`. Default
to no extra params so every other caller of `PaginationHelper`/`Pagination` (e.g. `GamePcs`,
games list, treasures, etc.) is unaffected. `GameCharactersHelper.render(...)` (which renders
`<Pagination .../>`) will need a new optional prop threaded through from `GameNpcs.jsx` to
carry the active filters down to `PaginationHelper`.

### Step 6 — Tests

Add Jasmine specs (follow existing spec structure under `frontend/specs/assets/js/...`
mirroring `assets/js/...`):
- `NpcFiltersController` — status/slain mapping in both directions, query-building
  (omitting blank fields), `clear()`.
- `NpcFiltersHelper`/`NpcFilters` — renders the three controls, calls the right handlers.
- `HashRouteResolver#getFilterParams` — reads `slain`/`name` from hash query string, ignores
  when absent.
- `GameNpcsController` — the existing `npcListFetchSpec.js` suite is the natural place to add
  cases asserting filter params are forwarded to both `fetchIndex`/`fetchNpcsAll` when
  present in the hash, and omitted when absent.
- `PaginationHelper`/`Pagination` — pagination links include extra params when provided, and
  omit them (unchanged behavior) when not — extend `PaginationSpec.js`/
  `PaginationHelperSpec.js`.
- `GameNpcsSpec.js` — Query/Clear button interactions update state/URL and trigger a re-fetch.

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — add `getFilterParams()`.
- `frontend/assets/js/client/GenericClient.js` and/or
  `frontend/assets/js/components/pages/controllers/GameNpcsController.js` — forward filter
  params to both NPC list requests.
- `frontend/assets/js/components/elements/NpcFilters.jsx` (new)
- `frontend/assets/js/components/elements/controllers/NpcFiltersController.js` (new)
- `frontend/assets/js/components/elements/helpers/NpcFiltersHelper.jsx` (new)
- `frontend/assets/js/components/pages/GameNpcs.jsx` — render `NpcFilters`, handle
  Query/Clear, pass active filters down for pagination links.
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` — thread an
  optional extra-params prop through to `Pagination`/`PaginationHelper`.
- `frontend/assets/js/components/elements/Pagination.jsx` and
  `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` — support extra
  query params in the link template.
- `frontend/assets/js/components/elements/PageLink.jsx` — verify/extend if the link template
  substitution needs to support more than `:page`/`:perPage` placeholders.
- Corresponding spec files under `frontend/specs/assets/js/...` for all of the above.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`) — run via `docker-compose run` against the frontend service.
- `frontend`: `npm run lint` (CI job: `checks` — "Check JS Lint") — run via `docker-compose run` against the frontend service.
- `frontend`: `npm run check_i18n` (CI job: `checks`) — run via `docker-compose run` against the frontend service; validates key parity across `en.yaml`/`pt.yaml` for the new keys added by `translator`.

## Notes

- Confirm exactly how pagination link clicks currently propagate into a controller re-fetch
  (full page hash navigation vs. an in-app listener) before deciding whether "Query"/"Clear"
  should set `window.location.hash` directly or call a router helper — match whatever
  mechanism `Pagination`/`PageLink` already relies on so behavior stays consistent (e.g. a
  hash change is expected to trigger `GameNpcs`'s effect the same way a page-link click
  currently does).
- Keep `GameCharactersHelper.render(...)`'s signature change additive/optional so `GamePcs`
  keeps working unmodified and unfiltered.
