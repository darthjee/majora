# Plan: Add public NPC filter

Issue: [133-add-public-npc-filter.md](../issues/133-add-public-npc-filter.md)

## Overview

Add a `hidden` boolean field to the `Character` model so DMs can suppress specific NPCs from the public listing. The public `GET /games/{slug}/npcs.json` endpoint will filter out hidden NPCs; a new authenticated endpoint `GET /games/{slug}/npcs/all.json` returns the full NPC roster (including hidden ones) for DMs and superusers. The frontend fetches both endpoints in parallel when a token is present and uses whichever succeeds.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### New `hidden` field on Character

- Model field: `hidden = models.BooleanField(default=False)`
- Included in `CharacterUpdateSerializer` so DMs/superusers may toggle it via `PATCH /games/{slug}/npcs/{id}.json`.

### New endpoint: `GET /games/{slug}/npcs/all.json`

- **URL:** `/games/<slug:game_slug>/npcs/all.json`
- **Auth:** Token required. Returns `401` if unauthenticated, `403` if authenticated but not a DM or superuser.
- **Success (200):** JSON array — same shape as the existing NPC listing: `[{id, name, avatar_url, game_slug}, ...]`. Includes NPCs with `hidden=True`.
- **Pagination:** same `Paginator` wrapper as `game_npcs`; `page`/`pages`/`per_page` headers included.
- **Permission gate:** reuses `CharacterEditPermission.check` pattern (the game-level equivalent guards DM/superuser access for the game — see backend plan for details).

### Behaviour change to existing endpoints

- `GET /games/{slug}/npcs.json` — now filters `hidden=False`.
- `GET /games/{slug}/npcs/{id}.json` — returns `404` for hidden NPCs when the requester is not a DM or superuser.
