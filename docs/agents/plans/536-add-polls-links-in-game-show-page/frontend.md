# Frontend Plan: Add Polls Links In Game Show Page

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend exposes `GET /games/<slug>/polls.json` (list, `?status=` filter, paginated: `page`/`per_page` params, `page`/`pages`/`per_page`/`total` response headers), `GET /games/<slug>/polls/<id>.json` (detail, nested `options: [{id, option}]`), `POST /games/<slug>/polls.json` (create, payload `{title, description, type, options: [{option}]}`, `type` is `"single"`/`"multiple"`, `status` in responses is `"open"`/`"inactive"`/`"closed"`). See `plan.md` for exact shapes.
- All three poll pages, and the widget, gate visibility on `is_dm || is_player || is_superuser || is_staff` from `AccessStore.getGameAccess(gameSlug)`/`ensureGameAccess(gameSlug)` (already wired into `GameController`/`AccessStore` — no new access endpoint).
- New routes: `/games/:game_slug/polls` (`gamePolls`), `/games/:game_slug/polls/new` (`gamePollNew`), `/games/:game_slug/polls/:id` (`gamePoll`) — see `plan.md`'s note on the route-naming deviation from the issue's literal text.
- All new user-visible strings go through `Translator.t()`; coordinate exact key names with `translator.md` (proposed there, source of truth is whatever this implementation ends up calling).

## Implementation Steps

### Step 1 — `PollClient`

Add `frontend/assets/js/client/PollClient.js` (extends `BaseClient`, mirrors `GameTaskClient.js`):
- `fetchPolls(gameSlug, token, params = new URLSearchParams())` — `GET /games/<slug>/polls.json[?params]`.
- `fetchPoll(gameSlug, id, token)` — `GET /games/<slug>/polls/<id>.json`.
- `createPoll(gameSlug, token, fields)` — `POST /games/<slug>/polls.json`.

### Step 2 — Open-polls widget on the game show page

Add a small, self-fetching widget (its own component + controller, following the `ResilienceIndicator`/`ResilienceIndicatorController` self-contained pattern rather than routing the fetch through `GameController`):
- `frontend/assets/js/components/resources/game/pages/elements/OpenPollsWidget.jsx` — props: `game` (needs `game_slug`, `is_dm`, `is_player`, `is_superuser`, `is_staff`). Renders nothing if none of those four booleans are true. Otherwise, on mount, calls `PollClient.fetchPolls(game.game_slug, token, new URLSearchParams({ per_page: '1', status: 'open' }))`, reads the `total` response header (not the body) for the count, and renders a react-bootstrap `<Placeholder>` (glow/wave animation — first use of this component in the codebase, `react-bootstrap` `2.10.10` already has it, no new dependency) while the request is in flight, then the resolved count with a link to `#/games/<slug>/polls`.
- `.../elements/controllers/OpenPollsWidgetController.js` — owns the fetch/parse logic (`#parseInt` the `total` header, same defensive parsing as `GameTasksController#parseInt`), keeps the component thin.
- `.../elements/helpers/OpenPollsWidgetHelper.jsx` — rendering, per this codebase's controller/helper split convention.

Wire it into `GameHelper.jsx`'s `#renderNextSession`-adjacent output: render `<OpenPollsWidget game={game} />` immediately after the existing `#renderNextSession(game)` call in `GameHelper.render` (per the issue: "right below the Next session section").

### Step 3 — Register the three new routes

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: add, in the file's existing most-specific-first ordering,
  ```js
  this.#router.register('/games/:game_slug/polls/new', 'gamePollNew');
  this.#router.register('/games/:game_slug/polls/:id', 'gamePoll');
  this.#router.register('/games/:game_slug/polls', 'gamePolls');
  ```
  (register `new` before `:id` before the bare list route, same ordering already used for `sessions/new` -> `sessions/:id` -> `sessions`.)
- `frontend/assets/js/utils/access/accessRouteConfig.js`: add `gamePolls`, `gamePollNew`, `gamePoll` entries to `ROUTE_TEMPLATES`, `{ pattern: '/games/:game_slug/polls', params: ['game_slug'] }` shaped like the existing `gameTasks`/`gameSessions` entries (`gamePoll` additionally needs `:id` if a per-poll access kind is ever introduced — for this issue, reuse the plain `game`-kind check like `gameTasks`, since poll-level authorization is entirely game-scoped, not per-poll).
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import and register `GamePolls`, `GamePollNew`, `GamePoll` in the `PAGES` map, following the existing `gameTasks: <GameTasks />` pattern.

### Step 4 — Game polls list page (`gamePolls`)

Add `frontend/assets/js/components/resources/game/pages/GamePolls.jsx` + `controllers/GamePollsController.js` + `helpers/GamePollsHelper.jsx`, following `GameTasks.jsx`/`GameTasksController.js`'s shape closely (list + pagination), but:
- Gate on `is_dm || is_player || is_superuser || is_staff` (via `AccessStore.ensureGameAccess`/`getGameAccess`, not `ensureGamePermissions().can_edit` — `GameTasksController`'s DM-only gate doesn't apply here, players must get in too), redirecting to the game page otherwise (same `#redirectToGame` shape as `GameTasksController`).
- Add a status filter bar, following the `NpcFilters.jsx`/`NpcFiltersController.js`/`NpcFiltersHelper.jsx` split exactly (a `PollFilters` element: a single Status `<select>` — blank/open/inactive/closed — Query/Clear buttons, backed by `HashRouteResolver().getFilterParams()`/hash-based `status` query param, same wiring as `GameNpcs.jsx`'s `handleFilterQuery`/`handleFilterClear`).
- Each list row links to `#/games/<slug>/polls/<id>`, shows `title` and `status`. A "New Poll" button/link to `#/games/<slug>/polls/new`, visible unconditionally within this already-gated page (creation shares the same audience as viewing, per `plan.md`).

### Step 5 — Game poll detail page (`gamePoll`)

Add `frontend/assets/js/components/resources/game/pages/GamePoll.jsx` + `controllers/GamePollController.js` + `helpers/GamePollHelper.jsx`, mirroring `GameSession.jsx`'s single-object fetch/render shape: fetch `PollClient.fetchPoll`, gate the same way as Step 4, render `title`, `description`, `type`, `status`, and the `options` list (plain read-only list — voting is out of scope, so no interactive controls on options here).

### Step 6 — New game poll page (`gamePollNew`)

Add `frontend/assets/js/components/resources/game/pages/GamePollNew.jsx` + `controllers/GamePollNewController.js` + `helpers/GamePollNewHelper.jsx`, following `GameSessionNew.jsx`/`GameSessionNewController.js`'s controlled-form shape, with:
- Fields: `title` (text), `description` (textarea), `type` (radio: single/multiple).
- A dynamic `options` array in component state, seeded as `['']` (one blank entry). Each non-blank entry renders with a trash-fill bootstrap-icon button (project already depends on `bootstrap-icons` — reuse the existing icon-button convention, e.g. as seen on `CharacterLinksField`/links-edit modal's per-entry remove control) that removes that entry; the last entry, while still blank, has no trash icon. Typing a non-blank value into the currently-last entry appends a new blank entry after it (so there's always exactly one blank entry at the end) — this state-transition logic belongs in `GamePollNewController` (e.g. `handleOptionChange(index, value, options, setOptions)`), not inline in the component, per this codebase's controller-owns-logic convention.
- On submit, filter out the blank trailing entry (and any other accidentally-blank entries) before calling `PollClient.createPoll(gameSlug, token, { title, description, type, options: options.filter(Boolean).map((option) => ({ option })) })`; on success, redirect to the new poll's detail page (`#/games/<slug>/polls/<id>`, same "redirect to detail after create" pattern as `GameSessionNewController`, if it does that — otherwise mirror whatever `GameSessionNewController.submitForm` currently does on success, e.g. redirect to the list). On 400, surface `fieldErrors` the same way `GameSessionNewController`/`GameTasksController` do.

### Step 7 — Specs

Add Jasmine specs mirroring the existing `GameTasks`/`GameSession`/`GameSessionNew` spec structure under `frontend/specs/components/resources/game/pages/` (and `elements/` for the widget, `elements/controllers/`, `elements/helpers/` for its controller/helper), covering: widget count/loading/link rendering and its visibility gate; list page rendering, filter, pagination, gating/redirect for a non-member; detail page rendering; new-poll form's dynamic option add/remove behavior and successful/failed submission.

## Files to Change

- `frontend/assets/js/client/PollClient.js` — new
- `frontend/assets/js/components/resources/game/pages/elements/OpenPollsWidget.jsx` — new
- `frontend/assets/js/components/resources/game/pages/elements/controllers/OpenPollsWidgetController.js` — new
- `frontend/assets/js/components/resources/game/pages/elements/helpers/OpenPollsWidgetHelper.jsx` — new
- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx` — render the widget below "Next session"
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — register the three new routes
- `frontend/assets/js/utils/access/accessRouteConfig.js` — register the three new route templates
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the three new page components
- `frontend/assets/js/components/resources/game/pages/GamePolls.jsx` — new
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollsController.js` — new
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollsHelper.jsx` — new
- `frontend/assets/js/components/resources/game/pages/elements/PollFilters.jsx` — new
- `frontend/assets/js/components/resources/game/pages/elements/controllers/PollFiltersController.js` — new
- `frontend/assets/js/components/resources/game/pages/elements/helpers/PollFiltersHelper.jsx` — new
- `frontend/assets/js/components/resources/game/pages/GamePoll.jsx` — new
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js` — new
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx` — new
- `frontend/assets/js/components/resources/game/pages/GamePollNew.jsx` — new
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollNewController.js` — new
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollNewHelper.jsx` — new
- `frontend/specs/...` — new specs mirroring the paths above

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Confirm with `translator.md`'s actual key names once written/implemented — do not hardcode English strings.
- The widget's `Placeholder` usage is a first for this codebase; keep it minimal (one line, roughly the width of the eventual count text) rather than introducing a new generic "placeholder" pattern component, unless a second use case shows up.
