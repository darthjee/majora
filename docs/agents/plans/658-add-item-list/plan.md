# Plan: Add item list

Issue: [658-add-item-list.md](../../issues/658-add-item-list.md)

## Overview

Add a read-only "Item" feature for special magic items, modeled on the existing Treasure
feature but simpler: `GameItem` is the top of the hierarchy (no shared cross-game registry
like `Treasure`), and `CharacterItem` links a `GameItem` to a PC or NPC with its own optional
overrides that fall back to the `GameItem`'s values when null. This issue covers models,
read-only endpoints, and three new list pages (PC Items, NPC Items, Game Items) plus preview
sections on the PC/NPC show pages — no creation, update, or photo upload flow.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### Endpoints (backend produces, frontend consumes)

All six endpoints are paginated (standard `page`/`pages`/`per_page`/`total` headers, see
[pagination.md](../../pagination.md)) and return a JSON array of objects under `data`
(`GenericClient.fetchIndex`).

| Endpoint | Access | Includes `hidden` |
| --- | --- | --- |
| `GET /games/:game_slug/pcs/:id/items.json` | everyone | no (hidden excluded from list) |
| `GET /games/:game_slug/pcs/:id/items/all.json` | dm, owner, admin | yes |
| `GET /games/:game_slug/npcs/:id/items.json` | everyone | no (hidden excluded from list) |
| `GET /games/:game_slug/npcs/:id/items/all.json` | dm, admin | yes |
| `GET /games/:game_slug/items.json` | everyone | no (hidden excluded from list) |
| `GET /games/:game_slug/items/all.json` | dm, admin | yes |

`CharacterItem` list item shape (PC/NPC endpoints):

```json
{
  "id": 1,
  "game_item_id": 5,
  "name": "Cloak of Elvenkind",
  "description": "...",
  "photo_path": "photos/character_items/1/photo.jpg",
  "hidden": false
}
```

`GameItem` list item shape (Game endpoint):

```json
{
  "id": 5,
  "name": "Cloak of Elvenkind",
  "description": "...",
  "photo_path": "photos/game_items/5/photo.jpg",
  "hidden": false
}
```

- `hidden` is only present in the `/all.json` variants (same convention as
  `CharacterTreasureAllSerializer`).
- `name`/`description`/`photo_path` on a `CharacterItem` are **already fallback-resolved**
  server-side (null → the linked `GameItem`'s value) — the frontend renders whatever comes
  back and never needs its own fallback logic.
- Frontend's `CharacterItemListItem`/`GameItemListItem` wrapper classes must read exactly
  these field names.

### i18n keys (translator produces, frontend consumes)

- `character_items_preview.empty` — empty state text for the PC/NPC show-page item preview.
- `character_page.items_title` — per-character nav-dropdown label linking to the item list.
- `character_items_page.loading` / `.title` — shared by the PC and NPC Items pages.
- `game_items_page.loading` / `.title` — Game Items page.

Frontend references these keys as-is; translator adds them to `en.yaml`/`pt.yaml` under the
existing conventions in [frontend/assets/i18n/](../../../../frontend/assets/i18n/).

### UI convention

Preview sections (PC/NPC show pages): limited to 5 items, "see more" icon `box2-heart-fill`,
same `PreviewSection`/`MAX_PREVIEW_ITEMS` mechanism already used for treasures.
