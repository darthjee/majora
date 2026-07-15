# Frontend Plan: View session list

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes, from the backend (see [plan.md](plan.md) for full shapes):

- `GET /games/:game_slug.json` response gains `next_session: { title, date } | null`.
- `GET /games/:game_slug/sessions.json` (GET/list) is **removed** — replaced by
  `GET /games/:game_slug/sessions/past.json`, `.../future.json`, `.../unscheduled.json`, each
  paginated the same way as the old endpoint (`page`/`pages`/`per_page` response headers) and
  returning `{ id, title, date, game_slug }` items. `POST /games/:game_slug/sessions.json`
  (create) is unchanged.
- `GameSession` gains a `description` field, present on `GET .../sessions/:id.json` (detail) and
  accepted by `POST .../sessions.json` / `PATCH .../sessions/:id.json` — **not** present on the
  3 list endpoints above.

## Implementation Steps

### Step 1 — Next session on the game page

- `components/resources/game/pages/controllers/GameController.js`: no change needed — it
  already fetches and passes through the full game detail payload, which will now include
  `next_session`.
- `components/resources/game/pages/helpers/GameHelper.jsx`: in `render()`, add a "next session"
  block (title + date, or an empty/"no upcoming session" state when `game.next_session` is
  `null`) and a button to `#/games/${game.game_slug}/sessions`. Reuse existing button
  components (e.g. `NewButton`/a plain `<a className="btn ...">`) for visual consistency with
  the rest of the page — this page already links out to `pcs`/`npcs` via
  `CharacterPreviewSection`'s `seeAllHref`, so place the sessions block/button near those.
- Add i18n keys under `game_page:` in both `frontend/assets/i18n/en.yaml` and `pt.yaml` (e.g.
  `next_session_title`, `no_next_session`, `view_sessions`) — reuse the existing
  `game_page.sessions` key (`Sessions`, already used by the header nav link in
  `HeaderHelper.jsx`) for the button label if it fits, instead of adding a duplicate.

### Step 2 — Split the sessions page into 3 columns

This is the one place with no existing precedent in the codebase (`Pagination`/
`PaginationHelper` hardcode `page`/`per_page` as query param names — see plan.md Notes). Chosen
approach:

- `controllers/GameSessionsController.js`: replace the single `#fetchSessions` call with 3
  parallel calls (`fetchIndex('/games/:slug/sessions/past.json', ...)`, `.../future.json`,
  `.../unscheduled.json`), each passed **distinct** explicit `page`/`per_page` values via
  `extraParams` (`GenericClient.fetchIndex`'s `extraParams` already overrides whatever the
  URL-derived resolver would set — see `client/GenericClient.js#buildIndexParams`). Read the 3
  initial page numbers from **distinct** hash query params (e.g. `past_page`, `future_page`,
  `unscheduled_page`) instead of the shared `page`/`per_page` that `getPaginationParams()`
  reads — parse them directly from `HashQueryParams.parse(hash)` rather than through
  `BasePageController`'s existing single-pagination helpers, since 3 independent paginations
  need 3 independent state slices.
- `pages/GameSessions.jsx`: hold 3 separate `{ sessions, pagination }` state pairs (past/
  future/unscheduled) instead of one.
- `helpers/GameSessionsHelper.jsx`: render 3 columns (e.g. Bootstrap `row` /
  `col-md-4` — no existing 3-column list precedent to copy, but this matches the 2-column
  `row`/`col-md-4`+`col-md-8` pattern already used in `GameHelper.jsx`), each with its own
  heading, list (reuse the existing `#renderSessionItem` per-item rendering), and its own
  `Pagination` instance — pass each `Pagination` a `basePath` of `#/games/:slug/sessions` plus
  `extraParams` that include the *other two* columns' current page/per_page (so paginating one
  column doesn't reset the others) and a distinctly-named page param for itself. If
  `Pagination`'s hardcoded `page`/`per_page` param names turn out to be too rigid for this,
  extend `Pagination`/`PaginationHelper` to accept a `pageParam`/`perPageParam` override
  (defaulting to `'page'`/`'per_page'` so every other caller is unaffected) rather than
  duplicating the component.
- Keep the existing "Back" (`PageActions`) and "New session" (`NewButton`, `canEdit`-gated via
  `AccessStore.ensureGamePermissions`) buttons as-is — just above the 3 columns.
- Add i18n keys under `game_sessions_page:` for the 3 column headings (e.g. `past`, `future`,
  `unscheduled`) in both `en.yaml` and `pt.yaml`.

### Step 3 — `description` field

- `components/resources/game_session/pages/helpers/GameSessionHelper.jsx`: render
  `session.description` on the detail page (below the date), matching how `GameHelper.jsx`
  conditionally renders `game.description` (`{game.description && <p className="mt-3
  text-pre-wrap">...}`).
- `pages/GameSessionNew.jsx` / `helpers/GameSessionNewHelper.jsx` and
  `pages/GameSessionEdit.jsx` / `helpers/GameSessionEditHelper.jsx`: add a `description` form
  field using the existing `TextareaField` component (`components/common/TextareaField.jsx`),
  add `description` state, wire it into `formValues`/`onDescriptionChange`, and include it in
  the payload passed to `GameSessionClient.createSession`/`updateSession`
  (`client/GameSessionClient.js` needs no change — it already forwards whatever `fields` object
  it's given).
- Add i18n keys `description_label` under `game_session_new_page:` and
  `game_session_edit_page:` (and reuse for the detail page if a label is needed there) in both
  `en.yaml` and `pt.yaml`.

### Step 4 — Tests

- Update specs under `frontend/specs/` mirroring every file touched above (Jasmine specs mirror
  `assets/js/` structure per `AGENTS.md`): `GameHelper`, `GameSessionsController`,
  `GameSessionsHelper`, `GameSessions` page, `GameSessionHelper`, `GameSessionNewHelper`/
  `GameSessionNewController`, `GameSessionEditHelper`/`GameSessionEditController`.
- Run `npm run check_i18n` locally after editing both `en.yaml` and `pt.yaml` to confirm the key
  sets stay in sync.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx`
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js`
- `frontend/assets/js/components/resources/game_session/pages/GameSessions.jsx`
- `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionsHelper.jsx`
- `frontend/assets/js/components/common/Pagination.jsx` / `components/common/helpers/PaginationHelper.jsx` (only if a `pageParam`/`perPageParam` override is needed — see Step 2)
- `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx`
- `frontend/assets/js/components/resources/game_session/pages/GameSessionNew.jsx` / `GameSessionEdit.jsx`
- `frontend/assets/js/components/resources/game_session/pages/helpers/GameSessionNewHelper.jsx` / `GameSessionEditHelper.jsx`
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionNewController.js` / `GameSessionEditController.js`
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml`
- Corresponding spec files under `frontend/specs/`.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`, via `npm run coverage`).
- `frontend`: `npm run lint` (CI job: `frontend-checks`).
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`).

## Notes

- The 3-independent-paginations-on-one-page problem (Step 2) has no existing precedent in this
  codebase — implementer should feel free to adjust the exact query-param naming scheme as long
  as the 3 columns paginate independently without clobbering each other's page state.
- Coordinate the `next_session` payload shape and the exact `description` field name with the
  backend agent's output before wiring the frontend — both are captured precisely in
  [plan.md](plan.md)'s "Shared contracts", so no guessing should be needed once that's
  implemented.
