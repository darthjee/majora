# Plan: Add edit button when navigating into character page

Issue: [126_add-edit-button-when-navigating-into-character-page.md](../issues/126-add-edit-button-when-navigating-into-character-page.md)

## Overview

The Tent proxy caches all `.json` responses. Because `can_edit` is embedded in the cached character detail response, a logged-in user may receive the cached anonymous version (`can_edit: false`) and never see the edit button. To fix this, we add dedicated `access.json` endpoints for PCs and NPCs that skip the proxy cache and return only the access flag. The frontend then calls these endpoints separately and overlays the `can_edit` value onto the character state.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### Access endpoints

| Method | URL | Auth required | Response shape |
|--------|-----|---------------|----------------|
| `GET` | `/games/<slug>/pcs/<id>/access.json` | Optional (token via `Authorization: Token <key>`) | `{"can_edit": true\|false}` |
| `GET` | `/games/<slug>/npcs/<id>/access.json` | Optional | `{"can_edit": true\|false}` |

- The response header `X-Skip-Cache: true` must be set on every response from both endpoints so Tent does not cache them.
- Unauthenticated requests return `{"can_edit": false}` with HTTP 200 (not 401).
- The `can_edit` logic mirrors the existing `Character.can_be_edited_by()` check already used by the PATCH and `full.json` endpoints.

### Frontend integration

The frontend (both `PcCharacterController` and `NpcCharacterController`) must:
1. After loading the character detail, call the appropriate access endpoint with the current token.
2. Merge `can_edit` from the access response into the character state before setting it.
3. Because the access endpoint always returns 200, treat a non-ok response as `can_edit: false`.

### CharacterClient additions

Two new methods on `CharacterClient`:
- `fetchPcAccess(gameSlug, characterId, token)` — calls `/games/<slug>/pcs/<id>/access.json`
- `fetchNpcAccess(gameSlug, characterId, token)` — calls `/games/<slug>/npcs/<id>/access.json`

Both send `Authorization: Token <key>` when a token is present (same pattern as `fetchPc` / `fetchNpc`).
