# Add Header to all routes

## Context

The app has a `Header` component (`frontend/assets/js/components/elements/Header.jsx`) already mounted on every page via `AppHelper.render()`, but it currently only renders a static "Majora" title and subtitle — it has no navigation. We need it to provide the navigation surface for the app: a link back home, a list of nav links (starting with Games), and placeholders for login/logout.

## What needs to be done

- **Frontend**:
  - Update `Header.jsx` (and/or its helper, following the existing `<Component>` + `<Component>Helper.jsx` split used elsewhere, e.g. `BackButton`/`BackButtonHelper`) so that:
    - "Majora" is rendered as a link to `/` (i.e. `href="#/"`), instead of a plain `<h1>`.
    - A list of nav links is rendered, starting with a "Games" link to `#/games`. The list should be structured so additional links can be appended easily in the future.
    - A placeholder area for login/logout links/buttons is present in the markup, but not functional yet (no auth wiring) — e.g. a disabled or static link/button, clearly marked as not implemented.
  - No routing changes needed — `Header` is already globally rendered by `AppHelper`, so this issue only touches the component's internal markup.

## Acceptance criteria

- [ ] Clicking "Majora" in the header navigates to `/` (`#/`).
- [ ] The header shows a "Games" link that navigates to `#/games`.
- [ ] The header has a clearly identifiable login/logout placeholder area (not wired to real auth).
- [ ] A Jasmine spec exists for `Header` (e.g. `frontend/specs/assets/js/components/elements/HeaderSpec.js`) covering the rendered links.
