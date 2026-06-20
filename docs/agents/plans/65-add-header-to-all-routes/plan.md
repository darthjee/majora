# Plan: Add Header to all routes

Issue: [65-add-header-to-all-routes.md](../../issues/65-add-header-to-all-routes.md)

## Overview

`Header.jsx` is already mounted on every page by `AppHelper.render()`, but it only renders a static title. This plan adds navigation to it: a home link on the "Majora" title, a "Games" nav link, and a non-functional login/logout placeholder, following the existing `<Component>` + `<Component>Helper.jsx` split used by other elements (e.g. `BackButton`/`BackButtonHelper`).

## Context

- `frontend/assets/js/components/elements/Header.jsx` currently renders only `<h1>Majora</h1>` and a subtitle — no links.
- `Header` is already globally rendered via `frontend/assets/js/components/helpers/AppHelper.jsx` (`<Header />` inside `.app`), so no routing/wiring changes are needed — only the component's internal markup changes.
- Hash-based routing convention: plain `<a href="#/...">` links (see `BackButton.jsx` / `frontend/assets/js/components/pages/helpers/GameHelper.jsx` using `href="#/games"`, `GamesHelper.jsx` using `href="#/"`).
- Component/helper split convention: `Header.jsx` (presentational, delegates to a helper) + `helpers/HeaderHelper.jsx` (render logic), mirroring `BackButton.jsx` + `helpers/BackButtonHelper.jsx`.

## Implementation Steps

### Step 1 — Add `HeaderHelper`

Create `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` with a static `render()` method that returns the header markup:
- A home link: `<a href="#/">Majora</a>` (replacing the plain `<h1>Majora</h1>`, keeping it as a heading-styled link, e.g. wrap the `<a>` in an `<h1>`).
- A `<nav>` with a `<ul>` of links, starting with `<li><a href="#/games">Games</a></li>` — structured so more `<li>` entries can be appended later.
- A login/logout placeholder area (e.g. a disabled button or a `<span>`/`<a>` with a `data-testid="auth-placeholder"` and text like "Login" with a comment noting it's not wired to auth yet).

### Step 2 — Update `Header.jsx`

Change `Header.jsx` to delegate to `HeaderHelper.render()`, mirroring `BackButton.jsx`'s delegation pattern.

### Step 3 — Tests

Add `frontend/specs/assets/js/components/elements/HeaderSpec.js` (and a `helpers/HeaderHelperSpec.js` if the helper has logic worth testing on its own, mirroring `BackButtonHelperSpec.js`), using `renderToStaticMarkup` like `BackButtonSpec.js`, asserting:
- The rendered HTML contains `href="#/"` and the text "Majora".
- The rendered HTML contains `href="#/games"` and the text "Games".
- The rendered HTML contains the login/logout placeholder marker.

### Step 4 — Lint and verify

Run `npm run lint` and `npm run coverage` (or `npm test`) locally inside `frontend/` to confirm the new component and specs pass.

## Files to Change
- `frontend/assets/js/components/elements/Header.jsx` — delegate rendering to `HeaderHelper`.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — new file, header markup with home link, nav list, and auth placeholder.
- `frontend/specs/assets/js/components/elements/HeaderSpec.js` — new spec file.

## CI Checks
- `frontend/`: `npm run coverage` (CI job: `jasmine`)
- `frontend/`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Login/logout is explicitly out of scope (per the issue) — only a visual placeholder is added, no auth state or API calls.
- No new nav links beyond "Games" are required now; the markup should make it easy to add more later (issue mentions "any other links that will come in the future").
