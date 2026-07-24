# Issue: Clear cache on items acquire / remove

## Description
Character-connected entities (treasures, photos, items, and in the future documents and possessions) each need their own cache-cleanup rules in the proxy. Cache clearing for these is defined across:
- `proxy/extension/lib/configuration/cache_cleanup/pcs.php`
- `proxy/extension/lib/configuration/cache_cleanup/npcs.php`
- `proxy/extension/lib/configuration/cache_cleanup/treasures.php`
- `proxy/extension/lib/configuration/cache_cleanup/items.php`

Treasures and items already have their own dedicated files, but `pcs.php`/`npcs.php` still embed a character-scoped "treasures" group (covering buy/sell/acquire/remove) and a character-scoped "items" group (covering item detail/photo upload only) alongside the routes unique to the PC/NPC entity itself.

## Problem
- The character-scoped "treasures" and "items" cache-cleanup groups still live inside `pcs.php`/`npcs.php` instead of their entity's own file, mixing concerns and making these files grow with every new connected entity.
- Character item `acquire`, `acquire/all`, `remove`, and `remove/all` do not clear cache, unlike the equivalent treasures routes (`buy`, `sell`, `acquire`, `acquire/all`, `remove`), so a PC's or NPC's items list can go stale after these actions.

## Expected Behavior
- `pcs.php`/`npcs.php` only contain cache-cleanup groups for routes unique to the PC/NPC entity itself (detail, full, photo upload, photos, and the npcs collection). The character-scoped treasures and items groups live entirely in `treasures.php`/`items.php` instead.
- After a PC's or NPC's item is acquired or removed (single or bulk), that character's items list caches (`items.json`, `items/all.json`) are cleared, the same way treasures already behave today.

## Solution
### Consolidate treasures and items groups into their own files
Move the character-scoped treasures group (buy/sell/acquire/acquire-all/remove) currently embedded in `pcs.php` and `npcs.php` into `treasures.php`, and move/extend the character-scoped items group (currently only detail/photo-upload) into `items.php`. `pcs.php`/`npcs.php` keep only the groups unique to the PC/NPC entity itself.

### Add cache clearing for character item acquire/remove, including bulk variants
Add cache-cleanup groups (in `items.php`, after the consolidation above) so these routes clear the character's items list, mirroring how treasures already work:

#### PCs
Routes:
- `POST /games/:game_slug/pcs/:character_id/items/acquire.json`
- `POST /games/:game_slug/pcs/:character_id/items/acquire/all.json`
- `POST /games/:game_slug/pcs/:character_id/items/remove.json`
- `POST /games/:game_slug/pcs/:character_id/items/remove/all.json`

Targets:
- `/games/:game_slug/pcs/:character_id/items.json`
- `/games/:game_slug/pcs/:character_id/items/all.json`

#### NPCs
Routes:
- `POST /games/:game_slug/npcs/:character_id/items/acquire.json`
- `POST /games/:game_slug/npcs/:character_id/items/acquire/all.json`
- `POST /games/:game_slug/npcs/:character_id/items/remove.json`
- `POST /games/:game_slug/npcs/:character_id/items/remove/all.json`

Targets:
- `/games/:game_slug/npcs/:character_id/items.json`
- `/games/:game_slug/npcs/:character_id/items/all.json`

## Benefits
- Restores parity between items and treasures cache invalidation, avoiding stale item lists after acquiring or removing items, including the DM-only bulk operations.
- Keeps each connected entity's full cache-cleanup logic — including its character-scoped routes — colocated in a single file, making `pcs.php`/`npcs.php` easier to read and scale as more connected entities (documents, possessions) are added.
