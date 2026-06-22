# Plan: Correct header

Issue: [93-correct-header.md](../../issues/93-correct-header.md)

## Overview
Rework `HeaderHelper.jsx` so the header renders as a proper Bootstrap navbar instead of plain `<header>/<nav>/<ul>/<li>` markup. The project already depends on `react-bootstrap` (see `LoginModalHelper.jsx`'s use of `Modal`), so the header should follow the same pattern: use `react-bootstrap`'s `Navbar`/`Nav` components for structure, keeping all existing `data-testid` attributes, handlers, and translations unchanged.

## Context
`Header.jsx` (the component) only manages state and delegates rendering to `HeaderHelper.render`. `HeaderHelper.jsx` currently renders:
- a bare `<header>` with an `<h1>`/`<p>` title/subtitle and a home link
- a `<nav><ul><li>` games link
- auth controls (`#renderAuthControl`) and test-email status (`#renderTestEmailStatus`) rendered as plain `<button className="btn btn-link">` elements
- a `LanguageSelector` and a `LoginModal`

None of this uses Bootstrap navbar conventions (`navbar`, `navbar-brand`, `navbar-nav`, `nav-item`, `nav-link`, `container`/`container-fluid`), so it doesn't look like a real header.

## Implementation Steps

### Step 1 — Wrap the header in a Bootstrap Navbar
Replace the outer `<header>` with `react-bootstrap`'s `<Navbar>` (e.g. `bg="light"`, `expand` as appropriate) wrapping a `<Navbar.Brand>` for the title/home link and a `<Container>`/`<Navbar.Collapse>` for the nav content, following the same import style used in `LoginModalHelper.jsx` (`import Navbar from 'react-bootstrap/cjs/Navbar.js';`, etc.).

### Step 2 — Convert the nav list to `Nav`/`Nav.Link`
Replace the `<nav><ul><li>` games link with `react-bootstrap`'s `<Nav>` and `<Nav.Link>` (keeping `href="#/games"`).

### Step 3 — Restyle auth controls and test-email status
Keep `#renderAuthControl` and `#renderTestEmailStatus` as private static helpers, but render their buttons/status using Bootstrap-styled markup consistent with the new navbar (e.g. place them inside the `Nav`/`Navbar.Collapse`, keep `btn btn-link` classes or switch to `Nav.Link`-style buttons as fits). Preserve all `data-testid` attributes (`auth-control`, `send-test-email`, `test-email-status`) exactly as-is.

### Step 4 — Keep `LanguageSelector` and `LoginModal` untouched
These are separate components already passed through unchanged; only their placement inside the new navbar markup should change, not their props.

### Step 5 — Verify specs still pass
Run the existing `HeaderHelperSpec.js` (and `HeaderSpec.js`/`HeaderControllerSpec.js` if affected) to confirm the rendered HTML still contains every string/testid the specs assert on (e.g. `href="#/"`, `href="#/games"`, `data-testid="auth-control"`, `data-testid="send-test-email"`, `data-testid="test-email-status"`, `data-testid="language-selector"`, translated text like "Login"/"Logoff"/"Games"/"Majora").

## Files to Change
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — replace plain HTML header/nav markup with `react-bootstrap` `Navbar`/`Nav` components while preserving handlers, translations, and `data-testid` attributes.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Do not change `Header.jsx` or `HeaderController.js` — the issue is scoped to rendering/markup in `HeaderHelper.jsx`, not state/behavior.
- Do not change `LanguageSelector.jsx` or `LoginModal.jsx` — only their position within the new header markup.
- Keep JSDoc comments in `HeaderHelper.jsx` accurate if method signatures or parameter shapes change.
