# Issue: Add item list

## Description
Characters (PCs and NPCs) should be able to hold special magic items, similar to how Treasures work today but simpler: items are scoped to a single game rather than living in a shared cross-game registry like `Treasure` does.

Inspired by the Treasure feature, but intentionally not a 1:1 copy — see the model comparison and "Out of scope" notes below.

## Solution

### Models
Unlike Treasure, there is no shared cross-game `Item` registry — `GameItem` is the top of the hierarchy.

| Treasure | Item |
| --- | --- |
| `Treasure` (global registry) | *(none — no cross-game item registry)* |
| `GameTreasure` | `GameItem` |
| `CharacterTreasure` | `CharacterItem` |

### Attributes

#### `GameItem`
- Belongs to a `Game`
- Has a photo via a dedicated `GameItemPhoto` model (mirrors `TreasurePhoto`)
- `name`: string
- `description`: text
- `photo_url`: same pattern as Treasure's photo
- `hidden`: boolean

#### `CharacterItem`
- Belongs to a `Character` (PC or NPC)
- Belongs to a `GameItem`
- Unique per `(character, game_item)` — one row per character per item type, matching `CharacterTreasure`'s constraint
- Has a photo via a dedicated `CharacterItemPhoto` model (mirrors `TreasurePhoto`)
- `name`: string
- `description`: text
- `photo_url`: same pattern as Treasure's photo
- `hidden`: boolean

#### Fallback attribute
In the API response, for each attribute on `CharacterItem`, if it is `null` it falls back to the corresponding `GameItem` attribute — except `hidden`, which is never inherited.

### Changed pages
- PC show page `/#/games/:game_slug/pcs/:id`: add an item list beneath the treasure list.
- NPC show page `/#/games/:game_slug/npcs/:id`: add an item list beneath the treasure list.

Both previews follow the existing Treasure preview pattern (`PreviewSection` / `MAX_PREVIEW_ITEMS`):
- Limited to 5 items
- "See more" icon: `box2-heart-fill`

### New pages
All three list pages are built on the reusable `ListPage`/`listTypeConfig` stack introduced in #665 (a new `items` entry added to `listTypeConfig`), rather than the older bespoke pattern still used by the not-yet-migrated PC/NPC Treasure pages.

#### PC Items Page — `/#/games/:game_slug/pcs/:id/items`
Paginated list of `CharacterItem` for the PC.

- `GET /games/:game_slug/pcs/:id/items.json` — accessible to everyone; excludes hidden items
- `GET /games/:game_slug/pcs/:id/items/all.json` — accessible to dm, owner, admin; includes hidden items

#### NPC Items Page — `/#/games/:game_slug/npcs/:id/items`
Paginated list of `CharacterItem` for the NPC.

- `GET /games/:game_slug/npcs/:id/items.json` — accessible to everyone; excludes hidden items
- `GET /games/:game_slug/npcs/:id/items/all.json` — accessible to dm, admin; includes hidden items

#### Game Items Page — `/#/games/:game_slug/items`
Paginated list of `GameItem` for the Game.

- `GET /games/:game_slug/items.json` — accessible to everyone; excludes hidden items
- `GET /games/:game_slug/items/all.json` — accessible to dm, admin; includes hidden items

### Out of scope
- Creating items
- Updating items
- Photo upload flow (to follow the Treasure pattern in a later issue)
