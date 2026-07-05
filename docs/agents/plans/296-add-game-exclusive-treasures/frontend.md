# Frontend Plan: Add game-exclusive treasures

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md) for the full endpoint/field contract produced by `backend`. In summary,
this agent can rely on:

- `GET /games/<slug>/treasures.json` — unchanged shape, now also includes game-exclusive
  treasures; each item gains a `game_slug` (string or `null`) field.
- `POST /games/<slug>/treasures.json` — body `{"name": str, "value": int}` → `201` with the
  created treasure's detail (including `game_slug`).
- `GET`/`PATCH /games/<slug>/treasures/<int:id>.json` — new endpoint; `PATCH` body
  `{"name"?: str, "value"?: int}` → `200` with detail; `404` if the id doesn't belong to this
  game.
- `GET /games/<slug>/access.json` (existing `GameClient#fetchGameAccess`) → `{"can_edit": bool}`
  reflecting "superuser or this game's DM" — the exact same call `GameNpcsController` and
  `GameNpcNewController` already use.

## Implementation Steps

### Step 1 — Routes

In `frontend/assets/js/utils/HashRouteResolver.js`, register two new routes **before** the
existing `this.#router.register('/games/:game_slug/treasures', 'gameTreasures');` line (route
resolution order matters — more specific paths must be registered first, exactly like the
existing `npcs/new` / `npcs/:id/edit` entries are registered before the plain `npcs` route):

```js
this.#router.register('/games/:game_slug/treasures/new', 'gameTreasureNew');
this.#router.register('/games/:game_slug/treasures/:treasure_id/edit', 'gameTreasureEdit');
```

### Step 2 — `TreasureClient` additions

In `frontend/assets/js/client/TreasureClient.js`, add three methods mirroring the existing
`createTreasure`/`updateTreasure`/`fetchTreasure`, but scoped to a game:

```js
createGameTreasure(gameSlug, token, fields) {
  return this.request(`/games/${gameSlug}/treasures.json`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}) },
    body: JSON.stringify(fields),
  });
}

fetchGameTreasure(gameSlug, id, token) {
  return this.request(`/games/${gameSlug}/treasures/${id}.json`, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
  });
}

updateGameTreasure(gameSlug, id, token, fields) {
  return this.request(`/games/${gameSlug}/treasures/${id}.json`, {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}) },
    body: JSON.stringify(fields),
  });
}
```

### Step 3 — Game treasure creation page

Create `GameTreasureNewController.js` (`components/pages/controllers/`), modeled directly after
`GameNpcNewController.js` but posting `{name, value}` via
`treasureClient.createGameTreasure(gameSlug, token, {...})`, redirecting on success to
`#/games/${gameSlug}/treasures/${data.id}` (the existing global treasure detail page — it's
public/read-only and works for any treasure id), and gating `buildEffect()`/`submitForm` via
`gameClient.fetchGameAccess(gameSlug, token)` exactly like `GameNpcNewController` does (redirect
to `#/games/${gameSlug}/treasures` when `can_edit` is false).

Create `GameTreasureNew.jsx` + `helpers/GameTreasureNewHelper.jsx`, modeled after
`TreasureNew.jsx`/`TreasureNewHelper.jsx` (fields: `name`, `value`) combined with
`GameNpcNew.jsx`'s game-slug-aware wiring (`getGameSlugFromTreasureNewHash` helper exported from
the controller, same pattern as `getGameSlugFromNpcNewHash`).

### Step 4 — Game treasure edit page

Create `GameTreasureEditController.js`, modeled after `TreasureEditController.js` but:
- fetches the treasure via `treasureClient.fetchGameTreasure(gameSlug, id, token)` instead of
  the global `fetchTreasure` (this also gets a `404` for free if the id doesn't belong to this
  game);
- gates the page the same way `GameTreasureNewController` does (`fetchGameAccess`, redirect if
  `!can_edit`), instead of the old `AdminAccess.isSuperUser` check `TreasureEditController` uses;
- submits via `treasureClient.updateGameTreasure(gameSlug, id, token, {...})`;
- redirects on success to `#/games/${gameSlug}/treasures/${id}` (global detail page, read-only,
  works regardless of ownership).

Create `GameTreasureEdit.jsx` + `helpers/GameTreasureEditHelper.jsx`, modeled after
`TreasureEdit.jsx`/`TreasureEditHelper.jsx` (check `TreasureEditHelper.jsx` for the exact
field/loading/error markup to mirror; adapt only the routing/gameSlug bits).

### Step 5 — Register the new pages

In `frontend/assets/js/components/helpers/AppHelper.jsx`, import the two new page components
and add to `PAGES`:

```js
gameTreasureNew: <GameTreasureNew />,
gameTreasureEdit: <GameTreasureEdit />,
```

### Step 6 — Update the game treasures list page

`GameTreasuresController.js`:
- Replace the `AdminAccess.isSuperUser(this.authClient)` call in `buildEffect()` with a
  `gameClient.fetchGameAccess(gameSlug, token)` call (same shape as `GameNpcsController`'s
  `#fetchAccess`), setting a `canEdit` flag instead of `isSuperUser`. Add a `GameClient`
  constructor param (default `new GameClient()`) mirroring `GameNpcsController`'s
  constructor signature; keep backward-compatible constructor param ordering as much as
  possible, but this is an internal controller — check its spec file
  (`GameTreasuresControllerSpec.js`) and update call sites/mocks accordingly.

`GameTreasures.jsx`:
- Add `newHref = `#/games/${gameSlug}/treasures/new`` and pass it (plus the renamed `canEdit`
  flag) down to `GameTreasuresHelper.render`.

`GameTreasuresHelper.jsx`:
- Render a "New Treasure" button/link (using the `treasures_page.new_treasure` key's sibling —
  see `translator.md` for the exact new key name) next to the page title, shown only when
  `canEdit` is true (same visual slot/pattern as the game NPCs page's new-NPC button — check
  `GameCharactersHelper.jsx` for the exact markup to mirror).
- Pass, per treasure, a `canManage` boolean to `TreasureCard` computed as
  `canEdit && treasure.game_slug === gameSlug` — **exact string equality**, not a truthy check
  on `game_slug` alone (see `plan.md`'s rationale: this is the only reliable per-treasure signal
  available without a numeric game id).

`TreasureCard.jsx` / `TreasureCardHelper.jsx`:
- Rename the `isSuperUser` prop to `canManage` (used for both the upload-photo gating, unchanged
  behavior otherwise, and the new edit action).
- Add an "Edit" link/button, shown only when `canManage` is true, navigating to
  `#/games/${gameSlug}/treasures/${treasure.id}/edit` (the card will need the current `gameSlug`
  passed down alongside `canManage`, or the helper can derive it from the page's own
  `getGameSlugFromTreasuresHash` at the point where `GameTreasuresHelper` builds the link href
  and passes it straight into `TreasureCard` as a prop, whichever keeps the component's prop
  surface simplest — check `TreasureCard.jsx`'s existing prop-doc style and follow it).

### Step 7 — Tests

Update/add Jasmine specs mirroring the existing structure:
- `GameTreasureNewControllerSpec.js` (new) — mirror `GameNpcNewControllerSpec.js` /
  `TreasureNewControllerSpec.js`.
- `GameTreasureEditControllerSpec.js` (new) — mirror `TreasureEditControllerSpec.js`, adapted
  for the gameSlug-scoped fetch/update calls and the `fetchGameAccess` gating.
- `GameTreasuresControllerSpec.js` — update for the `canEdit`/`fetchGameAccess` change (was
  `isSuperUser`/`AdminAccess`).
- `TreasureCardSpec.js` / `TreasureCardHelperSpec.js` — update for the `canManage` rename and
  the new edit link.
- `TreasureClientSpec.js` — add coverage for `createGameTreasure`, `fetchGameTreasure`,
  `updateGameTreasure`.
- New specs for `GameTreasureNew.jsx`/`GameTreasureNewHelper.jsx` and
  `GameTreasureEdit.jsx`/`GameTreasureEditHelper.jsx`, mirroring the existing
  `TreasureNewSpec.js`-style coverage (find the exact file names under `specs/` for the
  existing `TreasureNew`/`TreasureEdit`/`GameNpcNew` pages and mirror their structure —
  note some page-level components may only be covered indirectly through their controller
  and helper specs, matching whatever the existing convention is for `TreasureNew.jsx` today).

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — register 2 new routes
- `frontend/assets/js/client/TreasureClient.js` — add 3 methods
- `frontend/assets/js/components/pages/controllers/GameTreasureNewController.js` — new
- `frontend/assets/js/components/pages/GameTreasureNew.jsx` — new
- `frontend/assets/js/components/pages/helpers/GameTreasureNewHelper.jsx` — new
- `frontend/assets/js/components/pages/controllers/GameTreasureEditController.js` — new
- `frontend/assets/js/components/pages/GameTreasureEdit.jsx` — new
- `frontend/assets/js/components/pages/helpers/GameTreasureEditHelper.jsx` — new
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register 2 new pages
- `frontend/assets/js/components/pages/controllers/GameTreasuresController.js` — `canEdit` via `fetchGameAccess`
- `frontend/assets/js/components/pages/GameTreasures.jsx` — pass `newHref`/`canEdit`
- `frontend/assets/js/components/pages/helpers/GameTreasuresHelper.jsx` — new-treasure button, per-card `canManage`
- `frontend/assets/js/components/elements/TreasureCard.jsx` — `canManage` rename + edit link
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` — same
- Matching spec files under `frontend/specs/assets/js/...` mirroring every file above

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm frontend npm run lint` (CI job: `frontend-checks`)

## Notes

- Do not gate the treasure detail page (`Treasure.jsx`, `#/treasures/:id`) — it stays exactly as
  today (public, read-only, works for any treasure regardless of ownership).
- The "upload photo" action's underlying request still goes to the existing
  `/treasures/${id}/photo_upload.json` endpoint (unchanged URL) — only the *visibility* gating
  and the *backend* permission check change; no frontend request-path change needed there.
- `translator` produces the new i18n keys this step references — coordinate key names with
  `translator.md` before wiring up `Translator.t()` calls (or use the same key names proposed
  there directly, they're already chosen to match this file's needs).
