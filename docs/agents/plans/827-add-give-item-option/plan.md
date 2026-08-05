# Plan: Add give item option

Issue: [827-add-give-item-option.md](../issues/827-add-give-item-option.md)

## Overview

Add an "Add Item" button to the item detail page that opens a modal letting a DM (or a player,
for their own PC) grant the current `GameItem` to any number of PCs/NPCs, with a configurable
quantity per character. This requires relaxing `CharacterItem`'s uniqueness constraint, adding
four new per-character summary endpoints plus a `@skip_cache` decorator, building the new modal
on a shared two-column layout component, and adding the new UI strings to both locales.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Summary endpoints (backend produces, frontend consumes)

Four new `GET` endpoints, one call per character as it's added to the modal's right-side list
(never batched):

- `GET /games/:game_slug/items/:item_id/npcs/:character_id/summary.json` — permission: none (open)
- `GET /games/:game_slug/items/:item_id/pcs/:character_id/summary.json` — permission: none (open)
- `GET /games/:game_slug/items/:item_id/npcs/:character_id/summary/all.json` — permission: dm/admin
- `GET /games/:game_slug/items/:item_id/pcs/:character_id/summary/all.json` — permission: dm/admin/owner (owner scoped to their own PC)

Response body: `{ "quantity": <int> }` — count of existing `CharacterItem` rows for that
`(character, game_item)` pair (regular variant excludes `CharacterItem.hidden=True` rows).

Error semantics: hidden/missing `character_id` on the **regular** variant → `404` (matches
`character_detail`'s `check_hidden` → `_hidden_gate_response` convention), not a silent omission
— there is no batch/list shape here to omit from.

Both `summary.json` views are decorated with the project's existing `@regular` plus a **new**
`@skip_cache` decorator (see backend plan); the `/summary/all.json` views use the existing
`@restricted` decorator as usual.

### Creation endpoint (backend changes, frontend reuses as-is)

The existing `POST /games/:game_slug/{npcs,pcs}/:id/items/acquire.json` endpoint
(`character_item_acquire` in `backend/games/views/game/_item_exchange.py`) is reused unchanged in
shape — only its "already owned" 400 dedup check is removed. Request/response bodies are
unchanged, so the frontend's existing acquire-request wiring (already used by `AcquireItemTab`)
needs no shape changes, only a new caller (see frontend plan) and no more `already_owned_error`
handling for the give-item flow's multi-instance calls.

### i18n keys (frontend defines the exact key list while building the modal; translator fills in both locales)

Namespace `give_item_modal` in `frontend/assets/i18n/en.yaml` / `pt.yaml`, mirroring the shape of
the existing `item_exchange_modal` namespace (title, tab labels + tooltips, search placeholder,
button labels, per-row tooltips, summary/error messages). See the frontend plan's "Files to
Change" for the concrete key names the frontend agent will reference — the translator agent adds
those same keys (do not invent different names).

## Notes

- The item-scoped-then-character URL nesting (`items/:item_id/{pcs,npcs}/:character_id/...`) is
  the *reverse* of the existing character-scoped-then-subresource convention encoded in
  `backend/games/urls/_character_routes.py`'s route builder — these four routes do not fit that
  builder and must be added as direct `path()` entries instead (see backend plan).
- Retrofitting the 8 existing exchange tabs onto the new shared two-column layout component is
  out of scope for this issue — tracked in [#988](https://github.com/darthjee/majora/issues/988).
