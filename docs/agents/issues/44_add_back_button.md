# Add back button

## Context

Navigation between pages currently happens only through forward links. There is no way to go back to the previous page in the hierarchy, so back buttons need to be added across the app.

The route `/#/games/:slug/characters/:id` is ambiguous, since it can be reached from either `/#/games/:slug/npcs` or `/#/games/:slug/pcs`. This needs to be resolved before a back button can be added to that page.

## What needs to be done

- Backend:
  - Split the endpoint `/games/:slug/characters/:id.json` into:
    - `/games/:slug/npcs/:id.json` (adds an NPC filter)
    - `/games/:slug/pcs/:id.json` (adds a PC filter)
- Frontend:
  - Split the `/#/games/:slug/characters/:id` view into two distinct routes:
    - `/#/games/:slug/npcs/:id`
    - `/#/games/:slug/pcs/:id`
  - Add back buttons to simple pages, returning to their parent page:
    - `/#/games` → `/#/`
    - `/#/games/:slug` → `/#/games`
    - `/#/games/:slug/pcs` → `/#/games/:slug`
    - `/#/games/:slug/npcs` → `/#/games/:slug`
    - `/#/games/:slug/npcs/:id` → `/#/games/:slug/npcs`
    - `/#/games/:slug/pcs/:id` → `/#/games/:slug/pcs`

## Acceptance criteria

- [ ] `/games/:slug/npcs/:id.json` and `/games/:slug/pcs/:id.json` endpoints exist and return the correctly filtered character
- [ ] The old ambiguous `/games/:slug/characters/:id` route/endpoint is replaced by the split routes
- [ ] Each listed page has a working back button to its parent page
- [ ] Existing tests are updated and pass for the split routes
