# Frontend Plan: Improv game list in home

Main plan: [plan.md](plan.md)

## Overview

The games grid (`/#/`, `/#/games/`, `/#/my-games/`) is rendered by the
shared `ListPage`/`ListPageHelper` component, reused by ~20 list types via
`listTypeConfig.js`. Today the grid's column classes are hardcoded per
breakpoint (only `lg` varies by `itemsPerRow`), and every card's photo box
is forced square via the shared `.card-photo-square` class. This plan
generalizes the column-class formula to adapt to the actual number of
rendered games, and adds an opt-in mechanism so only `games`/`my-games`
switch to a rectangular photo box — every other list type, and `CardPhoto`
usage elsewhere (photo galleries via `PhotoCardHelper.jsx`), stays exactly
as it is today.

## Context

Full design rationale, rejected alternatives, and the exact
count→column-class table live in the issue
(`docs/agents/issues/774-improv-game-list-in-home.md`); this plan only
covers the "how", not the "why".

## Steps

- [01 — Generalize the grid column-class formula](frontend/01-generalize-column-formula.md)
- [02 — Thread an optional photo className through CardPhoto/ActionsOverlay](frontend/02-thread-photo-classname.md)
- [03 — Add the rectangular card photo SCSS class](frontend/03-add-rect-photo-class.md)
- [04 — Opt in games/my-games list type configs](frontend/04-opt-in-list-type-configs.md)
- [05 — Update/add Jasmine specs](frontend/05-update-specs.md)

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- The `220px` rectangular photo height in Step 3 is a starting value;
  confirm it visually against the actual grid before finalizing (see the
  issue's "Rectangular card dimensions" section for the reasoning).
- No backend, permissions, translation, or CI-config changes are needed —
  this is a purely presentational, frontend-only change.
