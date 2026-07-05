# Plan: Reorganize buttons

Issue: [295-reorganize-buttons.md](../../issues/295-reorganize-buttons.md)

## Overview

Move the "Treasures"/"Sessions"/"See all photos" button-styled links out of
`GameHelper.jsx` and `CharacterHelper.jsx` and into the global `Header`, rendered as
plain nav links that only appear while viewing the relevant route. The header gains
route-awareness (current page + params) so it can conditionally render these
contextual links and keep them updated on hash change, following the same
`HashRouteResolver`/`hashchange` pattern already used by `AppController`.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- No new translation keys are introduced. The header reuses these **existing**
  translation keys (only their values change, and only for the two `see_all_photos`
  keys):
  - `game_page.treasures` — used for the header's "Treasures" nav link on the `game`
    route (value unchanged: `Treasures` / `Tesouros`).
  - `game_page.sessions` — used for the header's "Sessions" nav link on the `game`
    route (value unchanged: `Sessions` / `Sessões`).
  - `game_page.see_all_photos` — used for the header's "Photos" nav link on the
    `game` route. **Value changes** from `See all photos`/`Ver todas as fotos` to
    `Photos`/`Fotos`.
  - `character_page.see_all_photos` — used for the header's "Photos" nav link on the
    `pcCharacter`/`npcCharacter` routes. **Value changes** from `See all
    photos`/`Ver todas as fotos` to `Photos`/`Fotos`.
- Keys are not renamed and not removed, so `npm run check_i18n` key-parity stays
  green without any structural change — `translator` only edits values in
  `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`.
- `frontend` depends on `translator`'s value changes only for the final copy shown
  in the UI; the two workstreams can proceed in parallel since no key names change.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- The `header.nav_treasures` key is unrelated: it is the admin-only top-level link to
  `#/treasures` (the global treasures index), not the per-game
  `#/games/:game_slug/treasures` link. No change to that key or its link.
- `Header.jsx` currently renders unconditionally in `AppHelper.jsx`, outside the
  `key={hash}` React fragment that remounts page components — so it cannot rely on
  remounting to observe route changes. It must track the route itself via its own
  `hashchange` listener, mirroring `AppController#buildEffect`.
