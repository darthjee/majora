# Frontend Plan: Add treasures CRUD

Main plan: [plan.md](plan.md)

## Shared contracts

This work depends on the translator agent adding one new translation key, referenced via
`Translator.t()` in `HeaderHelper.jsx`:

- `header.nav_treasures`

This must exist in every locale file (`en.yaml`, `pt.yaml`) before the `check_i18n` /
`frontend-checks` CI job passes. No other contract crosses an agent boundary.

## Context

- Routes already registered in `HashRouteResolver.js`: `/treasures`, `/treasures/new`,
  `/treasures/:id/edit`, `/treasures/:id`, `/games/:game_slug/treasures`. Pages
  (`Treasures.jsx`, `TreasureNew.jsx`, `TreasureEdit.jsx`, `Treasure.jsx`,
  `GameTreasures.jsx`) and their controllers/helpers already exist and work — this issue
  only adds discoverability (nav link), access control (client-side admin guard), and a
  card-grid layout for the two index pages.
- `TreasuresController` (main index) and `GameTreasuresController` (game-scoped index)
  both fetch via `GenericClient.fetchIndex`, unaffected by the layout change.
- `TreasureNewController.buildEffect()` currently redirects to `#/treasures` when no auth
  token is present — this is a weaker, pre-existing check that only covers
  "unauthenticated", not "non-admin". It must be replaced (not supplemented) by the new
  admin check, which redirects to `#/` (home) instead of `#/treasures`.
- `TreasureEditController.buildEffect()` and `TreasuresController.buildEffect()` currently
  have no auth/admin check at all — same replacement is needed, added fresh.
- Per `docs/agents/product.md`, "admin" == Django `user.is_superuser`. The header already
  tracks this: `HeaderController#checkStatus` calls `AuthClient.status(token)` and reads
  `data.is_superuser`, but only stores it in `Header`'s own local state — there is no
  shared/global store today, so each guarded page controller must independently resolve
  superuser status the same way (via `AuthClient.status`), same pattern already used by
  `TreasureEditController#fetchTreasureAccess` and `TreasureNewController`/
  `TreasureEditController` for `AuthStorage.getToken()`.
- `CardAvatar.jsx` (character default photo) and `CardPhoto.jsx` (game default photo) are
  the existing pattern for a default-image card slot — each is a tiny function component
  importing its own default PNG from `../../../images/`. Follow the same pattern for
  treasures, but simpler: there is no real photo upload flow for treasures yet (explicitly
  out of scope, per the issue), so the treasure card image has no `url` prop — it always
  renders the placeholder.
- `CharacterCard.jsx`/`CharacterCardHelper.jsx` and `GameCard.jsx`/`GameCardHelper.jsx`
  are the existing pattern for a clickable Bootstrap card element used in an index grid
  (element component delegates to a static helper). Follow the same pattern for
  `TreasureCard`. Existing column classes: character `normal` is
  `col-sm-6 col-md-4 col-lg-3` (4/row at `lg`), character `small` is
  `col-sm-3 col-md-2 col-lg-1` (12/row at `lg`) — neither produces 6/row, so
  `TreasureCard` needs its own column classes (e.g. `col-6 col-sm-4 col-md-3 col-lg-2`,
  which is 6/row at `lg` as required, and scales down reasonably at smaller breakpoints).
- `GamesHelper.jsx` is the existing pattern for a `<div className="row">` grid of cards
  replacing a list — mirror this for `TreasuresHelper.jsx`/`GameTreasuresHelper.jsx`
  (currently both render `<ul className="list-group">`).
- `docs/agents/frontend.md` documents the Component/Controller/Helper split; every new
  piece below follows it.

## Implementation Steps

### Step 1 — Admin-guard utility

Add `frontend/assets/js/utils/AdminAccess.js`, a plain class (no JSX) with a single
static async method:

```js
import AuthClient from '../client/AuthClient.js';
import AuthStorage from './AuthStorage.js';

export default class AdminAccess {
  static async isSuperUser(client = new AuthClient()) {
    try {
      const response = await client.status(AuthStorage.getToken());

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return Boolean(data.is_superuser);
    } catch {
      return false;
    }
  }
}
```

Add `frontend/specs/assets/js/utils/AdminAccessSpec.js` covering: superuser true,
superuser false (`is_superuser: false`/absent), non-ok response, and a thrown/rejected
request — same shape as `HeaderControllerSpec.js`'s status-check tests.

### Step 2 — Wire the guard into the three admin-only page controllers

For each of `TreasuresController`, `TreasureNewController`, `TreasureEditController`:

- Add an `authClient` constructor parameter defaulting to `new AuthClient()` (alongside
  the existing client parameter), so tests can inject a spy.
- At the start of `buildEffect()`'s returned callback, `await AdminAccess.isSuperUser(this.authClient)`
  (the callback becomes/stays `async`, matching the existing `mounted`/`safeSet` guard
  pattern already used in these files). If the result is `false`, redirect
  (`window.location.hash = '/'`, guarded by `typeof window !== 'undefined'`, matching
  existing style) and return without doing any further fetch/state work. If `true`,
  proceed exactly as today.
- `TreasureNewController`: this **replaces** the existing "no token → redirect to
  `/treasures`" check entirely — remove it, since the admin check both supersedes it
  (an anonymous user is never a superuser) and changes the redirect target to `/`. Apply
  the same replacement to the `token` guard at the top of `submitForm` (an unauthenticated
  or non-admin submit attempt is already rejected server-side, but keep the early
  client-side bail using `AdminAccess.isSuperUser` for consistency — reuse the same
  pattern, redirecting to `/` instead of `/treasures`).
- `TreasuresController` and `TreasureEditController`: this is a new check, added before
  the existing fetch logic; `TreasureEditController`'s existing
  `#fetchTreasureWithAccess` logic is otherwise untouched.
- Keep `setLoading`/`loading` state defaulting to `true` so the page shows its loading
  state (not a content flash) during the brief admin check before the redirect/fetch.

Update the three existing spec files (`TreasuresControllerSpec.js`,
`TreasureNewControllerSpec.js`, `TreasureEditControllerSpec.js`) to inject a mock
`authClient` (`jasmine.createSpyObj('authClient', ['status'])`) and cover: redirect to
`/` when not superuser, no redirect + normal fetch when superuser. Update/replace the
existing `TreasureNewControllerSpec.js` cases that assert a redirect to `/treasures` on
no token — those now redirect to `/` (via the admin check) instead. Since `buildEffect()`
is now async, tests calling it directly must `await` its returned promise (or flush a
microtask) before asserting `fakeWindow.location.hash`, same as other async-effect specs
in this codebase (see `await new Promise((resolve) => setTimeout(resolve, 0));` used in
`TreasuresControllerSpec.js`).

### Step 3 — `default_treasure.png` placeholder asset

Add `frontend/assets/images/default_treasure.png` — a 256x256 PNG placeholder, matching
the existing style/format of `default_character.png` and `default_game.png` (same
dimensions, simple flat illustration, no photo). Use whatever image tooling is available
in the dev environment to produce it (there is no existing project script for this —
`default_game.png`/`default_character.png` were hand-authored in earlier issues); a
simple generated placeholder (e.g. a solid-color square with a treasure-chest glyph) is
acceptable, it only needs to look intentional and be visually distinct from the game/
character placeholders.

### Step 4 — `CardTreasureImage` element

Add `frontend/assets/js/components/elements/CardTreasureImage.jsx`, mirroring
`CardAvatar.jsx`/`CardPhoto.jsx` but with no `url` prop (always renders the placeholder,
since there is no treasure photo upload flow yet):

```jsx
import defaultTreasurePhoto from '../../../images/default_treasure.png';

export default function CardTreasureImage({ alt }) {
  return (
    <div className="card-photo-square">
      <img src={defaultTreasurePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
```

Add `frontend/specs/assets/js/components/elements/CardTreasureImageSpec.js` (mirrors
`CardPhotoSpec.js`/`CardAvatarSpec.js`): asserts the placeholder image renders with the
given `alt` text.

### Step 5 — `TreasureCard` element

Add `frontend/assets/js/components/elements/TreasureCard.jsx` (thin wrapper) and
`frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` (static render),
mirroring `CharacterCard.jsx`/`CharacterCardHelper.jsx`:

- Column class producing 6/row at `lg`: `col-6 col-sm-4 col-md-3 col-lg-2 mb-4` (smaller
  footprint than both existing `CharacterCard` size variants, per the issue).
- Whole card wrapped in `<a href={`#/treasures/${treasure.id}`}>` (global treasure detail
  page, matching the existing links in `TreasuresHelper.jsx`/`GameTreasuresHelper.jsx`).
- Card body shows the treasure `name` (e.g. `<h6 className="card-title">`) and `value`
  (e.g. `<p className="card-text text-muted mb-0">`), using `CardTreasureImage` for the
  image slot.

Add `frontend/specs/assets/js/components/elements/TreasureCardSpec.js` and
`frontend/specs/assets/js/components/elements/helpers/TreasureCardHelperSpec.js`
(mirroring `CharacterCardSpec.js`/`CharacterCardHelperSpec.js`): asserts the rendered
link href, the name and value text content, and the 6-per-row (`col-lg-2`) column class.

### Step 6 — Rework the two treasures index helpers to use the card grid

- `TreasuresHelper.jsx`: replace the `<ul className="list-group">` block with
  `<div className="row">{treasures.map((treasure) => <TreasureCard key={treasure.id} treasure={treasure} />)}</div>`,
  same as `GamesHelper.jsx`'s pattern. Keep `PageActions`/`NewButton`/`Pagination`
  unchanged.
- `GameTreasuresHelper.jsx`: same replacement. Keep `BackButton`/`Pagination` unchanged.

Add `frontend/specs/assets/js/components/pages/helpers/TreasuresHelperSpec.js` (does not
exist yet — create it from scratch, mirroring `GameTreasuresHelperSpec.js`'s structure:
render/renderLoading/renderError, asserting name/value text, treasure detail links,
`PageActions`/`NewButton` presence, and pagination). Update the existing
`GameTreasuresHelperSpec.js` only if any assertion relied on `list-group`/`li` markup —
its current assertions (name/value text, `href="#/treasures/:id"`, back button,
pagination, loading/error) should keep passing against the new grid markup unchanged;
verify this when running the suite rather than assuming.

### Step 7 — Header nav link

In `HeaderHelper.jsx`, add a superuser-only "Treasures" link next to the existing
"Games" link inside `<Nav className="me-auto">`:

```jsx
<Nav className="me-auto">
  <Nav.Link href="#/games">{Translator.t('header.nav_games')}</Nav.Link>
  {state.isSuperUser && (
    <Nav.Link href="#/treasures">{Translator.t('header.nav_treasures')}</Nav.Link>
  )}
</Nav>
```

`state.isSuperUser` is already threaded through from `Header.jsx`/`HeaderController` (no
change needed there). Update `HeaderHelperSpec.js`: add cases asserting the treasures nav
link renders when `isSuperUser: true` and is absent when `isSuperUser: false` (mirroring
the existing `isSuperUser`-gated `server-status` test cases already in that file).

### Step 8 — Run the full frontend dev cycle locally

```bash
docker-compose run majora_fe yarn lint
docker-compose run majora_fe yarn coverage
docker-compose run majora_fe yarn check_i18n
```

The last command only passes once the translator agent's `header.nav_treasures` key is in
place in both locale files.

## Files to Change

- `frontend/assets/js/utils/AdminAccess.js` — new admin-check utility
- `frontend/specs/assets/js/utils/AdminAccessSpec.js` — new
- `frontend/assets/js/components/pages/controllers/TreasuresController.js` — add admin guard
- `frontend/assets/js/components/pages/controllers/TreasureNewController.js` — replace token-only guard with admin guard
- `frontend/assets/js/components/pages/controllers/TreasureEditController.js` — add admin guard
- `frontend/specs/assets/js/components/pages/controllers/TreasuresControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/TreasureNewControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/TreasureEditControllerSpec.js`
- `frontend/assets/images/default_treasure.png` — new placeholder asset
- `frontend/assets/js/components/elements/CardTreasureImage.jsx` — new
- `frontend/specs/assets/js/components/elements/CardTreasureImageSpec.js` — new
- `frontend/assets/js/components/elements/TreasureCard.jsx` — new
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx` — new
- `frontend/specs/assets/js/components/elements/TreasureCardSpec.js` — new
- `frontend/specs/assets/js/components/elements/helpers/TreasureCardHelperSpec.js` — new
- `frontend/assets/js/components/pages/helpers/TreasuresHelper.jsx` — card grid instead of list
- `frontend/specs/assets/js/components/pages/helpers/TreasuresHelperSpec.js` — new
- `frontend/assets/js/components/pages/helpers/GameTreasuresHelper.jsx` — card grid instead of list
- `frontend/specs/assets/js/components/pages/helpers/GameTreasuresHelperSpec.js` — verify/update
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — admin-only nav link
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js` — cover nav link visibility

## CI Checks

- `frontend`: `docker-compose run majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- No backend, infra, proxy changes are needed — read endpoints are already public and
  writes are already admin-only server-side (per the issue); this only adds/tightens
  client-side UX around already-enforced rules, so there is no new attack surface for the
  `data-access`/`security` review agents to check.
- The admin guard adds one extra `AuthClient.status` round-trip per guarded page load;
  this mirrors the existing pattern already paid by `Header` on every page and by
  `TreasureEditController#fetchTreasureAccess`, so it is consistent with current
  performance characteristics, not a regression.
- `docs/agents/issues/264-add-treasures-crud.md` already carries a `tags: :shipit:`
  marker (pre-approval), so the PR for this issue can skip the review-and-wait loop once
  CI passes.
