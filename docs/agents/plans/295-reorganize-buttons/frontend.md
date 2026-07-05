# Frontend Plan: Reorganize buttons

Main plan: [plan.md](plan.md)

## Shared contracts

- Reuse existing translation keys — do not add new ones:
  - `game_page.treasures` for the header's "Treasures" nav link.
  - `game_page.sessions` for the header's "Sessions" nav link.
  - `game_page.see_all_photos` for the header's "Photos" nav link on the `game` route.
  - `character_page.see_all_photos` for the header's "Photos" nav link on the
    `pcCharacter`/`npcCharacter` routes.
- `translator` is renaming the *values* of the two `see_all_photos` keys to
  "Photos"/"Fotos" — no key names change, so this frontend work does not need to
  wait for that commit to land before writing code (only the rendered copy differs),
  but both should ship in the same PR.

## Implementation Steps

### Step 1 — Give `HashRouteResolver` a way to extract route params

`Router.extractParams(path, hash)` (`frontend/assets/js/utils/Router.js`) already
exists and does the param extraction; `HashRouteResolver` just doesn't expose it yet.
Add a method, e.g.:

```js
getParams(path) {
  return Router.extractParams(path, this.currentHash());
}
```

so callers can do `routeResolver.getParams('/games/:game_slug')` once they know the
current page is `game`, `pcCharacter`, or `npcCharacter` (from `getPage()`), without
needing a second router instance in `HeaderController`.

### Step 2 — Add route-awareness to `HeaderController`

`HeaderController` (`frontend/assets/js/components/elements/controllers/HeaderController.js`)
currently has no concept of the current route. Add:
- A `HashRouteResolver` instance (constructor param, default `new HashRouteResolver()`,
  following the existing pattern for other injected clients in this constructor).
- A method (e.g. `getRoute()`) returning `{ page, gameSlug, characterId }` (or similar),
  derived from `routeResolver.getPage()` plus `routeResolver.getParams(...)` for the
  matched route pattern (`/games/:game_slug`, `/games/:game_slug/pcs/:character_id`,
  `/games/:game_slug/npcs/:character_id`).
- A method to start/stop listening to `window` `hashchange` events and push updates
  into a new state setter (e.g. `setRoute`), mirroring `AppController#buildEffect`
  (see `frontend/assets/js/components/AppController.js:58-77`). Wire the listener
  lifecycle from `Header.jsx`'s `useEffect`, same place `checkStatus`/`startHealthCheck`
  are already wired.

### Step 3 — Wire `Header.jsx`

`frontend/assets/js/components/elements/Header.jsx`: add `route` state (initialized
from `controller.getRoute()` or a safe default), subscribe/unsubscribe the hashchange
listener in the existing `useEffect`, and pass `route` through to
`HeaderHelper.render(state, handlers)` as part of `state`.

### Step 4 — Extend `HeaderHelper.jsx`

Add two new private renderers, following the existing
`#renderTreasuresNavLink`/`#renderStaffUsersNavLink` pattern:
- `#renderGameNavLinks(state)` — when `state.route.page === 'game'`, renders three
  `Nav.Link`s: "Treasures" (`#/games/${gameSlug}/treasures`, label
  `game_page.treasures`), "Sessions" (`#/games/${gameSlug}/sessions`, label
  `game_page.sessions`), "Photos" (`#/games/${gameSlug}/photos`, label
  `game_page.see_all_photos`). Otherwise `null`.
- `#renderCharacterPhotosNavLink(state)` — when `state.route.page === 'pcCharacter'`
  or `'npcCharacter'`, renders a single `Nav.Link` "Photos" pointing to
  `#/games/${gameSlug}/pcs/${characterId}/photos` or
  `#/games/${gameSlug}/npcs/${characterId}/photos` respectively (label
  `character_page.see_all_photos`). Otherwise `null`.

Call both from `.render`, alongside the existing `#renderTreasuresNavLink`/
`#renderStaffUsersNavLink` calls in the `Nav className="me-auto"` block. Use plain
`Nav.Link` styling (no `btn`/`btn-outline-secondary` classes), matching the header's
existing nav links.

### Step 5 — Remove the buttons from the page helpers

- `frontend/assets/js/components/pages/helpers/GameHelper.jsx`: remove the
  `<div className="mt-3">...</div>` block containing the Treasures/Sessions/See-all-
  photos buttons (lines ~73-83).
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`: remove the
  `<div className="mt-3">...</div>` block containing the "See all photos" button
  (lines ~67-74).

### Step 6 — Update specs

- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js`: extend
  `buildState()` with a `route` default (e.g. `{ page: 'home' }`), and add cases
  asserting the new nav links appear only for the matching `route.page` (and
  `gameSlug`/`characterId` are interpolated correctly into the hrefs), and are absent
  otherwise.
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerSpec.js`:
  add coverage for the new route-resolution method and the hashchange
  subscribe/unsubscribe lifecycle (a fake `EventTarget` or a stub resolver, following
  whatever pattern `AppControllerSpec.js` uses for the equivalent behavior).
- `frontend/specs/assets/js/components/elements/HeaderSpec.js`: verify `route` state
  is initialized and updated, and passed through to `HeaderHelper.render`.
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` and
  `.../CharacterHelperSpec.js`: remove/update assertions that referenced the removed
  buttons.
- `frontend/specs/assets/js/utils/HashRouteResolverSpec.js`: add coverage for the new
  `getParams` method.

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — add `getParams(path)`.
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — add
  route resolution + hashchange lifecycle methods.
- `frontend/assets/js/components/elements/Header.jsx` — add `route` state, wire
  lifecycle, pass `route` to `HeaderHelper.render`.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — add
  `#renderGameNavLinks`/`#renderCharacterPhotosNavLink`, call them from `.render`.
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — remove the button
  block.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — remove the
  button block.
- `frontend/specs/assets/js/utils/HashRouteResolverSpec.js` — new `getParams` spec.
- `frontend/specs/assets/js/components/elements/controllers/HeaderControllerSpec.js` —
  new route/lifecycle specs.
- `frontend/specs/assets/js/components/elements/HeaderSpec.js` — route wiring specs.
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js` — new
  nav link specs.
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` — drop
  removed-button assertions.
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — drop
  removed-button assertions.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- Keep the header's new links styled as plain `Nav.Link`s (no `btn btn-outline-secondary`),
  per the issue's acceptance criteria.
- Double-check the exact route param names registered in `HashRouteResolver`
  (`game_slug`, `character_id`) when building hrefs, so the extracted params line up
  with the route patterns used in Step 1/2.
