# Plan: CharacterItem creation should create an empty CharacterItem in favor of GameItem

Issue: [765-characteritem-creation-should-create-an-empty-characteritem-in-favor-of-gameitem.md](../../issues/765-characteritem-creation-should-create-an-empty-characteritem-in-favor-of-gameitem.md)

## Overview

Two independent changes bundled in this issue:

1. **Creation behavior fix** — `POST .../pcs/:id/items.json` and `.../npcs/:id/items.json` currently write the submitted `name`/`description` onto both the new `GameItem` and the new `CharacterItem`. They must write `name`/`description` onto `GameItem` only, leaving those fields `null` on `CharacterItem` so the existing fallback serializer logic takes over. `hidden` keeps being written to both, unchanged.
2. **Endpoint rename** — the single-entity "everything including hidden" item endpoints are misnamed `.../items/:item_id/all.json`; `all.json` is the project's convention for collections (e.g. `.../items/all.json`), while `full.json` is the convention for single-entity "everything" views (already used by `.../pcs/:id/full.json`). Rename to `.../items/:item_id/full.json` for both character-scoped (pcs/npcs) and game-scoped items, including internal names, and update the proxy cache-cleanup config and the two frontend controllers that hardcode the old path.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)

## Shared contracts

- **Renamed route**: `GET /games/:game_slug/items/:item_id/all.json` → `GET /games/:game_slug/items/:item_id/full.json`, and the character-scoped equivalents `GET /games/:game_slug/pcs/:character_id/items/:item_id/all.json` / `GET /games/:game_slug/npcs/:character_id/items/:item_id/all.json` → `.../full.json`. Response shape/serializer output is unchanged — only the path suffix changes.
- **Frontend must switch** to requesting `.../full.json` instead of `.../all.json` for these single-entity item fetches once backend ships the rename (backend and frontend changes should land together in the same PR to avoid a broken intermediate state).
- **Proxy cache-cleanup config** (`proxy/extension/lib/configuration/cache_cleanup/{items,pcs,npcs}.php`) references these same paths as cache targets — they must be updated to `full.json` in lockstep with the backend rename, or cache invalidation for the renamed route will silently stop working (the old `all.json` target would never be hit again, and the new `full.json` path wouldn't be a registered target).
- **Creation payload/response is unchanged** — `POST items.json` still accepts `{name, description?, hidden?}` and returns the same `CharacterItemDetailFullSerializer` (renamed from `CharacterItemDetailAllSerializer`) shape; only the underlying `CharacterItem.name`/`description` DB values become `null` at creation instead of duplicating `GameItem`'s values.
