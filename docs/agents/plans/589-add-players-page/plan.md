# Plan: Add players page

Issue: [589-add-players-page.md](../../issues/589-add-players-page.md)

## Overview

Add a "Players" roster page (`/#/games/:game_slug/players`) reusing the existing
`ListPage`/`BaseListItem` list machinery, backed by a new `GET /games/:game_slug/players.json`
endpoint. Each item shows the player's PC (name/photo, falling back to the character
placeholder) plus a new circular avatar badge — rendered via the existing `InfoBar`
mechanism — showing the linked `User`'s Gravatar and display name. Also adds a DB-level
constraint enforcing at most one PC per `Player`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Endpoint

`GET /games/:game_slug/players.json` — paginated (standard `Paginator`, same shape as
`pcs.json`/`polls.json`), `X-Skip-Cache: true` always set on the response. Payload per item:

```json
{
  "id": 1,
  "user": {
    "display_name": "...",
    "photo_url": "..."
  },
  "character": {
    "name": "...",
    "photo_url": "..."
  }
}
```

- `user` is `null` when the `Player` has no linked `User` account.
- `character` is `null` when the player owns no PC (e.g. the DM) — the frontend falls back
  to the character placeholder image and omits the caption's name accordingly (same as PCs
  with no photo today).
- Ordering: backend returns players in `Player`'s default `Meta.ordering` (`['name']`); no
  filters (per the issue, "No filters for now").

### Frontend permission-gating equivalent

The frontend never calls a separate permissions endpoint for this page — the nav link and
page both rely on the existing `state.gameAccess` (`is_dm`/`is_player`/`is_superuser`/
`is_staff`), same as the existing Polls/Sessions links. The backend endpoint independently
enforces the same rule server-side (`PlayerPermission`, see [backend](backend.md)), so a
direct URL visit by an unauthorized user still gets a 401/403 from the API even if the nav
link were somehow reached.

### New i18n keys (frontend depends on translator adding these)

- `game_page.players` — nav dropdown link label / page heading text ("Players").
- `game_players_page.loading` — loading message passed to `ListPage`.

Both must exist, with identical values across all locale files, before the frontend page
renders correctly (`Translator.t` returns the raw key on a miss).
