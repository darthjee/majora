# Plan: Introduce Add document modal

Issue: [1005-introduce-add-document-modal.md](../issues/1005-introduce-add-document-modal.md)

## Overview

Add a "Give Document" modal on the game document detail page, mirroring "Give Item" (#827) and
"Give Treasure" (#1001) but with boolean (not quantity) ownership. This requires a net-new
document ownership summary endpoint pair (PC/NPC × regular/`all.json`), a new `regular` document
create permission tier so staff/players (not just staff/owner) can use the plain acquire/remove
endpoints, and a retroactive permission-gate fix on all three "Give X" buttons (Item, Treasure,
Document).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New backend endpoints (consumed by frontend's `documentConfig.js`)

- `GET /games/<slug>/documents/<document_id>/pcs/<id>/summary.json` — AllowAny, `X-Skip-Cache: true`
- `GET /games/<slug>/documents/<document_id>/npcs/<id>/summary.json` — AllowAny + hidden-NPC gate,
  `X-Skip-Cache: true`
- `GET /games/<slug>/documents/<document_id>/pcs/<id>/summary/all.json` — `restricted.create` on
  `game_pc_document` (staff, or the PC's owning player), `X-Skip-Cache: true`
- `GET /games/<slug>/documents/<document_id>/npcs/<id>/summary/all.json` — `restricted.create` on
  `game_npc_document` (staff only), `X-Skip-Cache: true`

Response shape for all four: `{"owned": <bool>}`.

### `documentConfig.js` new `GET.summary` entry

```js
GET: {
  summary: {
    regular: { path: summaryPath, permission: null, skipCache: true },
    private: { path: summaryAllPath, permission: 'can_edit', skipCache: true },
  },
}
```

where `summaryPath`/`summaryAllPath` take `{ gameSlug, documentId, kind, id }` and build
`/games/:gameSlug/documents/:documentId/:kind/:id/summary.json` /
`.../summary/all.json` — exact mirror of `treasureConfig.js`'s `summary` entry, just
`documentId` instead of `treasureId`. The existing `GET.availableCollection`/`POST.acquire`/
`POST.remove` entries are reused unchanged — no new acquire/remove request-config needed.

### Acquire/remove permission tier (consumed by frontend's acquire calls)

The plain `POST .../documents/acquire.json` / `.../remove.json` endpoints gain a new `regular`
permission tier (`staff`, `player` — the PC's owning player is already covered by `player`, since
any character owner is a player of the game). This is what makes the newly-widened "Give
Document" button (visible to any staff/dm/player/superuser) actually work end-to-end for a
non-owning player. The DM-only `/acquire/all.json` / `/remove/all.json` variants are **unchanged**
(see [backend.md](backend.md)'s Notes for why — the issue's originally-drafted `restricted.create`
narrowing turned out to be unnecessary once the view-level gates were traced).

### i18n namespace (consumed by frontend, produced by translator)

`give_document_modal.*` — see [translator.md](translator.md) for the full key list.

### Button visibility gate (frontend-internal, no cross-agent contract, noted for completeness)

All three "Give X" buttons (Item, Treasure, Document) gate on
`is_superuser || is_staff || is_dm || is_player` (`AccessStore.ensureGameAccess`), reusing/
extending the existing `canUploadPhoto`-shaped flag already computed by `GameItemController`/
`GameDocumentController`.
