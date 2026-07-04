# Frontend Plan: Add game sessions

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend endpoints from [plan.md](plan.md):

- `GET /games/<slug>/sessions.json` (paginated) — list
- `POST /games/<slug>/sessions.json` — create, `{title, date}`
- `GET /games/<slug>/sessions/<id>.json` — detail
- `PATCH /games/<slug>/sessions/<id>.json` — update, `{title, date}`

Uses `GameClient.fetchGame`/`fetchGameAccess` (already exist, used by `GameEditController`) to
gate the "New session"/"Edit" actions on `can_edit`, rather than assuming the session detail
response carries its own `can_edit` field — confirm against whatever the backend plan actually
ships (see backend.md's Notes) and adjust to consume `can_edit` directly from the session
detail response if that's what backend exposes instead.

## Implementation Steps

### Step 1 — `GameSessionClient`

Add `frontend/assets/js/client/GameSessionClient.js` (or extend an existing client if a closer
per-game-scoped-resource client convention already exists — check `TreasureClient.js` and
`GameClient.js` for the base pattern), with `fetchSessions` (index, via `GenericClient` style
`fetchIndex` or dedicated method), `fetchSession`, `createSession`, `updateSession` — same
shape as `TreasureClient`'s methods but game-scoped (`/games/${gameSlug}/sessions...`).

### Step 2 — Index page (`GameSessions`)

Add `GameSessions.jsx` + `GameSessionsController.js` + `GameSessionsHelper.jsx`, mirroring
`GameTreasures.jsx`/`GameTreasuresController.js`/`GameTreasuresHelper.jsx`:
- Paginated list fetch via `client.fetchIndex('/games/${gameSlug}/sessions.json')`.
- Render each session as a card/list item (title + date, linking to
  `#/games/${gameSlug}/sessions/${id}`).
- Back button to `#/games/${gameSlug}`.
- "New session" button/link to `#/games/${gameSlug}/sessions/new`, shown only when the game's
  `can_edit` is true (fetch via `GameClient.fetchGameAccess`, same pattern as `GameEditController`).

### Step 3 — New page (`GameSessionNew`)

Add `GameSessionNew.jsx` + `GameSessionNewController.js` + `GameSessionNewHelper.jsx`:
- Form with `title` (required) and `date` (optional date input).
- On mount, verify `can_edit` via `GameClient.fetchGameAccess`; redirect back to the sessions
  index (or show an error state) if the current user is not a GameMaster/superuser for the game —
  mirror whatever `TreasureNew`/`GameEdit` already do for gating access to a form page.
- Submit via `GameSessionClient.createSession`, redirect to the new session's show page
  (`#/games/${gameSlug}/sessions/${id}`) on success, surface field errors on 400 (mirror
  `GameEditController.submitForm`'s `setFieldErrors` pattern).

### Step 4 — Show page (`GameSession`)

Add `GameSession.jsx` + `GameSessionController.js` + `GameSessionHelper.jsx`, mirroring
`Treasure.jsx`/`TreasureController.js`/`TreasureHelper.jsx`:
- Fetch session detail; render `title`, `date` (formatted, or "no date" placeholder), back
  button to the sessions index.
- "Edit" button/link to `#/games/${gameSlug}/sessions/${id}/edit`, shown only when `can_edit`.

### Step 5 — Edit page (`GameSessionEdit`)

Add `GameSessionEdit.jsx` + `GameSessionEditController.js` + `GameSessionEditHelper.jsx`,
mirroring `GameEdit.jsx`/`GameEditController.js`/`GameEditHelper.jsx`:
- Fetch session detail + game access in parallel (`Promise.all`, same pattern as
  `GameEditController#fetchGameWithAccess`).
- Pre-filled form (`title`, `date`); submit via `GameSessionClient.updateSession`; redirect to
  the show page on success; per-field errors on 400.

### Step 6 — Routing

- `frontend/assets/js/utils/HashRouteResolver.js`: register, near the existing `treasures`/
  `gameTreasures` entries:
  ```js
  this.#router.register('/games/:game_slug/sessions/new', 'gameSessionNew');
  this.#router.register('/games/:game_slug/sessions/:id/edit', 'gameSessionEdit');
  this.#router.register('/games/:game_slug/sessions/:id', 'gameSession');
  this.#router.register('/games/:game_slug/sessions', 'gameSessions');
  ```
  (register the more specific `/new` and `/:id/edit` routes before the bare `/:id` route, same
  ordering convention already used for `treasures`).
- `frontend/assets/js/components/helpers/AppHelper.jsx`: import the four new page components
  and add `gameSessions`, `gameSessionNew`, `gameSession`, `gameSessionEdit` entries to `PAGES`.

### Step 7 — Link from the game show page

`frontend/assets/js/components/pages/helpers/GameHelper.jsx`: add a "Sessions" link/button
next to the existing "Treasures" link:
```jsx
<a href={`#/games/${game.game_slug}/sessions`} className="btn btn-outline-secondary ms-2">
  {Translator.t('game_page.sessions')}
</a>
```

### Step 8 — Translations

Hand off the new translation keys to the `translator` agent (or add them directly if no
dedicated agent run is warranted for this small a key set) — needed keys, mirroring the
`game_treasures_page.*`/`game_page.treasures` naming convention:
- `game_page.sessions` — the new link label on the game show page.
- `game_sessions_page.*` — `title`/heading, `loading`, `new_session` button label.
- `game_session_page.*` (show) — `loading`, `edit`, `no_date` placeholder.
- `game_session_new_page.*` / `game_session_edit_page.*` — form labels (`title`, `date`,
  `submit`), loading/error states — check `TreasureNewHelper.jsx`/`TreasureEditHelper.jsx` /
  `GameEditHelper.jsx` for the exact existing key names to mirror per field.

Add these keys to every locale file under `frontend/assets/i18n/*.yaml`, keeping key parity
across languages (the CI `check_i18n` job enforces this).

## Files to Change

- `frontend/assets/js/client/GameSessionClient.js` — new client
- `frontend/assets/js/components/pages/GameSessions.jsx`, `GameSessionNew.jsx`, `GameSession.jsx`, `GameSessionEdit.jsx` — new pages
- `frontend/assets/js/components/pages/controllers/GameSessionsController.js`, `GameSessionNewController.js`, `GameSessionController.js`, `GameSessionEditController.js` — new controllers
- `frontend/assets/js/components/pages/helpers/GameSessionsHelper.jsx`, `GameSessionNewHelper.jsx`, `GameSessionHelper.jsx`, `GameSessionEditHelper.jsx` — new helpers
- `frontend/assets/js/utils/HashRouteResolver.js` — register 4 new routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register 4 new page entries
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — add "Sessions" link
- `frontend/specs/assets/js/client/GameSessionClientSpec.js` and matching specs for every new controller/helper/page, mirroring the existing `Treasure*Spec.js` files
- `frontend/assets/i18n/*.yaml` — new translation keys (coordinate with `translator` agent)

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Confirm the final shape of `can_edit` exposure from backend.md's Notes before wiring the
  new/edit gating — either reuse `GameClient.fetchGameAccess` (this plan's default assumption)
  or read `can_edit` straight off the session detail response, whichever the backend actually
  ships, to avoid a redundant fetch.
- Keep date handling consistent with whatever date input component (if any) already exists in
  the codebase; otherwise use a plain `<input type="date">` bound to an ISO `YYYY-MM-DD` string,
  sending `null`/omitting the field when empty.
