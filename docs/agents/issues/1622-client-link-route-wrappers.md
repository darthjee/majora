# Issue: Client: link route wrappers

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records the agreed design: scope, permission model, token lifecycle, client shape and token management permissions.

Add the character link routes (character ↔ faction / document / item, for both PCs and NPCs) to the client resource wrappers, plus the related lists (faction members and the per-character summaries). Split out of #1609 by #1598.

Depends on #1609 (the `npcs`, `pcs`, `factions`, `items` and `documents` wrappers), which has landed.

## Problem

The client can read and edit NPCs, PCs, factions, items and documents, but it cannot link them: an automation cannot list what a character can acquire, acquire it, remove it, or read a faction's members. `docs/agents/client/library.md` lists link routes under "Not yet wrapped".

## Expected Behavior

Every route below has a tested wrapper method, documented in JSDoc and in the client docs, and lint passes.

### Routes (from `backend/games/urls/_character_routes.py`, for both `pcs` and `npcs`)

Under `games/<slug>/<pcs|npcs>/<character_id>/`:

| Link | Read | Write (`POST`) |
|---|---|---|
| factions | `factions` (+`/all`), `factions/<faction_id>` (+`/full`), `factions/available` (+`/all`) | `factions/acquire` (+`/all`), `factions/<faction_id>/remove` (+`/all`) |
| documents | `documents` (+`/all`), `documents/<document_id>` (+`/full`), `documents/available` (+`/all`) | `documents/acquire` (+`/all`), `documents/remove` (+`/all`) |
| items | `items` (+`/all`), `items/<item_id>` (+`/full`), `items/available` (+`/all`) | `items/acquire` (+`/all`), `items/remove` (+`/all`) |

- `remove` is a `POST` (not a `DELETE`); faction removal is per faction (`factions/<faction_id>/remove`), while document and item removal take the target in the body.
- Out of scope (decided): the character-item create/update (`POST items.json`, `PATCH items/<item_id>.json`), item photo upload (#1623), document files/photos sub-routes, and the possessions / recipes / treasures links.

### Related lists (in `backend/games/urls/games.py`)

- Faction members: `factions/<faction_id>/characters` (+`/all`).
- Per-character summaries: `items/<item_id>/<pcs|npcs>/<character_id>/summary` (+`/all`), and the same for `documents` and `factions`.
- **The API has no item-holders or document-characters list**, so those are not wrapped.

### Scopes (enforced by the API, never by the wrapper)

- A link write needs `write` on the owning family, the one the URL nests under (`npcs/<id>/items/acquire.json` needs `npcs:write`); the linked family needs no `write`.
- The `/all.json` variants of `acquire` and `remove` can touch hidden records of the linked family, so they also need its `read` (`npcs/<id>/documents/acquire/all.json` needs `npcs:write` and `documents:read`).
- Restricted reads need the `read` scope of every family in the response.
- See `docs/agents/access-control/token-scopes.md`.

### Errors and retries

- Link-route 422s come from the proxy `LinkHandler` as `{"status": "failed", "error": "<code>"}`; the core already maps them to an `ApiError` with `codes`.
- `acquire` and `remove` are `POST`s: never retried. Only `GET` is retried.

## Solution

Follow the shape of the existing wrappers (see `docs/agents/client/library.md#resource-wrappers`):

- Methods nested under their parent resource, plain parsed JSON returned, `list` returning a `Page` with an `iterate` counterpart, and a static `variants` map (action → regular / restricted URL, `null` when absent).
- The caller picks a restricted variant with an explicit `{ restricted: true }`; the default is the regular one. Asking for a variant or action that does not exist throws `UsageError` locally, before any request. No automatic fallback on 403.
- **Bound link sub-wrappers** on `npcs` and `pcs` (same pattern as `documents.pages(id)`; a blank character id throws `UsageError`):
  - `npcs.items(characterId)`, `npcs.documents(characterId)`, `npcs.factions(characterId)` (same on `pcs`) return a wrapper with `list` (+ `iterate`), `get(linkedId)`, `available()`, `acquire(data)` and `remove(...)`, each with its `{ restricted: true }` variant.
  - `items` / `documents`: `remove(data)` sends the body as-is to `remove.json`. `factions`: `remove(factionId, data?)` builds `factions/<faction_id>/remove.json`.
  - `acquire` / `remove` bodies are passed through as-is (no field renaming or validation).
- **Related lists on the linked family:**
  - `factions.characters(factionId)` → `factions/<id>/characters` (+`/all`), returning a `Page`, with an `iterate` counterpart if the route is paginated.
  - `items.summary(itemId, kind, characterId)`, `documents.summary(...)`, `factions.summary(...)` → `<family>/<id>/<pcs|npcs>/<character_id>/summary` (+`/all`); `kind` other than `'pcs'` / `'npcs'` throws `UsageError`.
- Unit tests with the `specs/support/` fetch stub: URL building per variant, headers, bodies, error mapping (including the `LinkHandler` 422), no retry on `POST`, and that no error contains the token.

### Docs to update

- `docs/agents/client/library.md` (move link routes out of "Not yet wrapped"; document the methods and variants);
- `client/README.md` (usage, and the "Work in progress" note);
- `docs/guides/client.md` (the consumer guide).

## Benefits

Automations can manage character memberships and inventories (factions, documents, items) through the client with fine-grained tokens, instead of hand-building link URLs.
