# Issue: Add Character Possession

## Description

Add `CharacterPossession`, the character-side counterpart to the already-existing `GamePossession` (#1074) — analogous to how `CharacterDocument` and `CharacterItem` relate to `GameDocument` and `GameItem`. A possession is like an item, but describes something big and unique (a house, a boat, a tavern, etc.) rather than a small carried object.

## Problem

Characters currently have no way to hold unique, large possessions in the way they can hold items or documents. `GamePossession` exists as the catalog-side entity, but there is no character-side model, permissions, routes, or UI to associate a possession with a specific PC/NPC.

## Expected Behavior

New pages/routes, mirroring the existing `.../items` and `.../documents` character routes:

- `/#/games/:game_slug/(n)pc/:id/possessions` — list
- `/#/games/:game_slug/(n)pc/:id/possessions/new` (with photo upload)
- `/#/games/:game_slug/(n)pc/:id/possessions/:id/edit` (with photo upload that replaces the previous photo)
- `/#/games/:game_slug/(n)pc/:id/possessions/:id` (detail, with photo upload that replaces the previous photo)

The possessions list page also has a modal to acquire and remove existing possessions from the game's `GamePossession` catalog, mirroring the items/documents acquire-remove modal.

## Solution

### Attribute delegation model

`CharacterPossession` follows the `CharacterDocument` pattern exactly: a thin join between `Character` and `GamePossession`, with no overridable fields (no per-character `name`/`description`/`photo` override). All display attributes are read straight from `GamePossession`, mirroring how `CharacterDocument` reads everything from `GameDocument`. This is unlike `CharacterItem`, which has nullable override fields (`name`, `description`, `photo`) that fall back to `GameItem`.

### Model

`CharacterPossession` is a thin join model, matching `CharacterDocument` exactly: `character` (FK, `CASCADE`), `game_possession` (FK, `CASCADE`), and a plain `hidden` field (never inherited from `GamePossession`, since — unlike the other delegated attributes — `hidden` is always a per-character setting, not shared catalog data). `unique_together` on `(character, game_possession)`: a character can only hold one join per `GamePossession`, but the same `GamePossession` can independently be held by multiple characters (no exclusivity). Removing a `CharacterPossession` (`/possessions/remove.json`) deletes only the join — the underlying `GamePossession` is untouched, matching `CharacterDocument`'s remove behavior.

### Permissions

`CharacterPossession` permissions mirror `game_pc_document` / `game_npc_document` exactly — not `game_pc_item` / `game_npc_item`. Item's permission shape has extra rows (`owner` role, `photo_upload` action) that only exist because Item has per-character overridable fields, including a character-level photo. Possession has none of that, so there is no character-level `photo_upload` action — the photo lives only on `GamePossession`.

| Scope | Action | PC Possession | NPC Possession |
|---|---|---|---|
| restricted | `create` | `staff`, `owner` | `staff` |
| regular | `create` | `staff`, `player` | `staff`, `player` |

(No `photo_upload` action at the Character level.)

### Creation and edit flow

Document has no character-level "new"/"edit" page at all — documents are only created at the Game level (`/games/:game_slug/documents/new`) and then acquired by a character. Only Item has a character-level creation page: `PcCharacterItemNew` POSTs to the character-scoped `items.json` endpoint, creating a new `GameItem` + `CharacterItem` together in one call (restricted permission), then uploads the photo directly to the newly-created `GameItem`. `PcCharacterItemEdit` separately edits the `CharacterItem`'s own override fields.

`CharacterPossession` follows Item's creation mechanics, without the override-field part (since it has none):

- `/possessions/new`: creates `GamePossession` + `CharacterPossession` together in one call (restricted create — see Permissions above), then uploads the photo directly to the new `GamePossession`.
- `/possessions/:id/edit` and the detail page's photo-replace: act directly on the underlying `GamePossession` through its existing endpoints (already built in #1074) — there is no character-side field to override, so these are gated by the existing `game_possession` regular permissions (`staff`, `player`), not a new "CharacterPossession edit" permission.

### Acquire and Remove

Follow the existing precedent set by Item/Document: `AcquireDocumentTab`/`RemoveDocumentTab` (+ their controllers/helpers) are copied verbatim into new `AcquirePossessionTab`/`RemovePossessionTab` files, renamed and pointed at possession endpoints. No shared/generic extraction — this issue stays scoped to adding Possession, consistent with how Item and Document were each added independently without deduplicating against each other.
