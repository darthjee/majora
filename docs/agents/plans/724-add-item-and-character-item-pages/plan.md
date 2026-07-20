# Plan: Add Item and Character Item pages

Issue: [724-add-item-and-character-item-pages.md](../issues/724-add-item-and-character-item-pages.md)

## Overview

Add three new detail pages — `/#/games/:game_slug/items/:id` (a `GameItem`), `/#/games/:game_slug/pcs/:character_id/items/:id` and `/#/games/:game_slug/npcs/:character_id/items/:id` (a `CharacterItem`) — each showing a simplified two-column layout (photo+name / description, with the existing Hidden badge). The backend adds six new read-only single-item views that reuse the existing list/all serializers verbatim (no new serializer classes) and the existing permission classes. The frontend adds a shared `ItemDetail`-style component (mirroring the recent Player detail page, issue #695) plus three thin page wrappers, and wires the existing non-clickable item cards (`buildNullItemHref`) to the new pages.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoints (backend produces, frontend consumes)

| Method | URL | Who can call | Response |
|---|---|---|---|
| GET | `/games/<slug>/items/<item_id>.json` | AllowAny | `GameItemListSerializer` shape (`id`, `name`, `description`, `photo_path`); 404 if hidden |
| GET | `/games/<slug>/items/<item_id>/all.json` | `GameEditPermission` (admin, DM) | `GameItemAllListSerializer` shape (adds `hidden`); returns even if hidden; `X-Skip-Cache: true` |
| GET | `/games/<slug>/pcs/<character_id>/items/<item_id>.json` | AllowAny | `CharacterItemSerializer` shape (`id`, `game_item_id`, `name`, `description`, `photo_path`); 404 if the `CharacterItem` is hidden |
| GET | `/games/<slug>/pcs/<character_id>/items/<item_id>/all.json` | `CharacterEditPermission` (admin, DM, PC's owning player) | `CharacterItemAllSerializer` shape (adds `hidden`); returns even if hidden; `X-Skip-Cache: true` |
| GET | `/games/<slug>/npcs/<character_id>/items/<item_id>.json` | AllowAny (plus the existing hidden-NPC gate) | Same shape as the PC variant | 
| GET | `/games/<slug>/npcs/<character_id>/items/<item_id>/all.json` | `GameEditPermission` (admin, DM only — **NPCs have no owner concept**, matching every other NPC `/all.json` endpoint) | Same shape as the PC `/all.json` variant; `X-Skip-Cache: true` |

All six mirror the access rules of the equivalent, already-existing list endpoints (`items.json`/`items/all.json`, `pcs/<id>/items.json`/`.../all.json`, `npcs/<id>/items.json`/`.../all.json`) exactly — see `docs/agents/access-control/game-item.md` and `character-item.md`. Unknown `game_slug`/`character_id`/`item_id` → 404.

### New frontend routes (frontend owns)

- `#/games/:game_slug/items/:id` → page key `gameItem`
- `#/games/:game_slug/pcs/:character_id/items/:id` → page key `pcCharacterItem`
- `#/games/:game_slug/npcs/:character_id/items/:id` → page key `npcCharacterItem`

Registered in `HashRouteResolver.js`'s `ROUTES` table, each placed before its corresponding list route (same ordering convention already used for `treasures/:id` vs `treasures`, and `.../items/new` vs `.../items`).

### Translation keys (translator produces, frontend consumes)

`Translator.t()` keys under a shared `item_page` namespace (or per-kind namespaces if the frontend agent's implementation ends up needing kind-specific copy) — see [translator.md](translator.md) for the starting proposal; the frontend agent's actual `Translator.t()` calls are the source of truth for exact key names.
