# Issue: Unify photo url

## Description
Several entities expose a photo reference in their API responses, but the naming is inconsistent across entities:

- `Game` exposes `cover_photo_path` (relationship attribute `cover_photo`, DB column `cover_photo_id`)
- `Character` (PC/NPC) exposes `profile_photo_path` (relationship attribute `profile_photo`, DB column `profile_photo_id`)
- `Treasure`, `GameItem`, `CharacterItem`, `GameDocument`, `GameDocumentFile` already expose `photo_path` (relationship attribute `photo`, DB column `photo_id`)

This issue unifies the naming so every entity uses the same relationship name (`photo`), the same DB column (`photo_id`), and the same serializer field (`photo_path`).

## Problem
Because the relationship/column/field names differ per entity (`cover_photo*` for `Game`, `profile_photo*` for `Character`, plain `photo*` for the rest), the frontend has to special-case each entity type to read its photo URL, and the backend cannot share common serializer/model code across entities for photo handling.

## Expected Behavior
For every affected entity:
- The model relationship to its current photo is named `photo`.
- The underlying DB column is named `photo_id`.
- The serializer exposes the field as `photo_path`.

The `Photo` entities themselves (`GamePhoto`, `TreasurePhoto`, `CharacterPhoto`, `GameItemPhoto`, `CharacterItemPhoto`, `GameDocumentPhoto`, `GameDocumentFilePhoto`) keep their own `path` column unchanged — only the owning entities' relationship/column/serializer-field names are unified.

## Solution
Rename the relationship, DB column, and serializer field to the unified `photo` / `photo_id` / `photo_path` naming for the entities that don't already conform:

- `Game`: rename relationship `cover_photo` -> `photo`, column `cover_photo_id` -> `photo_id`, serializer field `cover_photo_path` -> `photo_path`.
- `Character`: rename relationship `profile_photo` -> `photo`, column `profile_photo_id` -> `photo_id`, serializer field `profile_photo_path` -> `photo_path`.

Both column renames are simple in-place migrations (`RenameField`/`AlterField`) — no backfill needed since it's a straight rename, not a new column.

The following entities already use `photo` / `photo_id` / `photo_path` and need no relationship/column rename, but should be checked for any remaining inconsistent naming in serializers/helpers:
- `Treasure`, `GameItem`, `CharacterItem`, `GameDocument`, `GameDocumentFile`

The following don't have their own photo relationship — they proxy to a parent entity's photo at serialization time (e.g. `CharacterDocument` -> `game_document.photo`, `GameTreasure`/`CharacterTreasure` -> `treasure.photo`). No schema change is needed for these; just confirm their serializer field is (and stays) named `photo_path`.

### Affected endpoints
Any endpoint that returns one of the affected entities (list/detail/full variants), including but not limited to:
- `/games.json`, `/games/:game_slug.json`, `/games/:game_slug/full.json`
- `/treasures.json`, `/treasures/all.json`, `/treasures/:id.json`, `/treasures/:id/full.json`
- `/games/:game_slug/pcs*.json`, `/games/:game_slug/npcs*.json` (list/all/detail/full)
- `/games/:game_slug/treasures*.json` (list/all/detail/full)
- `/games/:game_slug/items*.json` (list/all/detail/full)
- `/games/:game_slug/documents*.json` (list/all/detail/full)
- `/games/:game_slug/documents/:doc_id/files*.json` (list/all/detail/full)
- `/games/:game_slug/pcs/:id/items*.json`, `/games/:game_slug/npcs/:id/items*.json` (list/all/detail/full)

### Out of scope
- `Photo` entities' own `path` column (photo upload/deletion untouched).
- `User`'s Gravatar-based avatar (`UserProfile.email_hash` -> `GravatarUrlBuilder`, exposed as `photo_url` in `PlayerUserSerializer`): this is a different mechanism (external URL, no local `Photo` row) and is not part of this unification.

## Benefits
- Frontend can read `photo_path` the same way for every entity, removing per-entity transformation logic.
- Backend can share model/serializer code for photo handling across entities instead of duplicating per-entity photo logic.
