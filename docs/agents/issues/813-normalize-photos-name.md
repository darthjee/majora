# Issue: Normalize photo path segments and file names

## Description

Photo upload endpoints across the backend each build their own storage file path independently. There is no shared abstraction for this, and neither the game slug nor the uploaded file name is sanitized before being embedded in the path.

## Problem

The path-building logic is duplicated across five separate view files, each producing a different path shape:

- `games/views/photo_upload.py` — Game gallery photo: `photos/games/{game_slug}/{stem}_{uuid}{ext}`
- `games/views/game/_photo_upload.py` — Character (PC/NPC) photo: `photos/games/{game_slug}/characters/{character_id}/{stem}_{uuid}{ext}`
- `games/views/game/_item_photo_upload.py` — Character item photo: `photos/games/{game_slug}/{pcs|npcs}/{character_id}/items/{item_id}/photo{ext}`
- `games/views/games/game_item_photo_upload.py` — Game item photo: `photos/games/{game_slug}/items/{item_id}/photo{ext}`
- `games/views/treasures/treasure_photo_upload.py` — Treasure photo (no game_slug, treasures can be game-less): `photos/treasures/{treasure_id}/photo{ext}`

None of these re-validate or sanitize `game_slug` before interpolating it into the path. It happens to originate from Django's `slugify` (`Game.game_slug`, a `SlugField` auto-populated in `games/models/game/game.py`), but nothing enforces that at path-build time.

The uploaded filename only goes through `PhotoUploadSerializer.validate_filename` (`games/serializers/photo_upload.py`), which strips directory components (`os.path.basename`) and checks the extension against a whitelist. It does not sanitize the filename stem for spaces or special characters before that stem is used as a path segment (in the Game and Character photo endpoints, where the stem is part of the path). For item and treasure photos, the path uses a fixed name (`photo{ext}`), so filename sanitization there has no effect on the resulting path, but should still run through the same shared logic for consistency.

`games/views/upload_finalize.py` has the same "spread logic" problem on the finalize side: it dispatches per entity type via `isinstance` chains (lines ~78-88 and ~104-113) instead of a single shared abstraction.

## Expected Behavior

- This is a backend-only change; no frontend changes are expected.
- No changes to permissions or authorization.

## Solution

- Introduce one centralized class responsible for building the storage path for a photo, based on the entity it belongs to, replacing the five duplicated path-building functions listed above. It takes the entity, the game slug and the raw filename, and:
  - Sanitizes the game slug and the filename stem using the same shared normalization logic (the game slug always goes through it, even though it is expected to already be a valid Django slug).
  - Only sanitizes the filename **stem** — the `.` separating the stem from the extension is preserved, and the extension itself continues to be validated separately against the existing whitelist.
  - Normalization rules:
    - Replace spaces, line breaks, and similar whitespace with underscore (`_`)
    - Transliterate accented/unicode letters to their closest ASCII equivalent (e.g. `é` → `e`), and strip other non-ASCII symbols (e.g. emoji)
    - Remove other invalid characters, including but not limited to: `&`, `/`, `\`, `:`, `,`, `[`, `]`, `(`, `)`, `{`, `}`
  - Takes whether to append a UUID to the stem as a parameter, so the current per-endpoint UUID-appending logic (used by Game and Character photo uploads) is also centralized rather than duplicated. Endpoints using a fixed name (e.g. `photo{ext}`) pass a fixed stem instead — sanitizing a fixed/static stem or a UUID-suffixed stem is always safe from ending up empty.
- Centralize the equivalent per-entity dispatch in `games/views/upload_finalize.py` (currently `isinstance` chains) as part of the same refactor.

## Benefits

- Prevents malformed or unsafe storage paths caused by unsanitized slugs/filenames
- Removes path- and dispatch-building logic duplicated across the view layer, including `upload_finalize.py`
- Centralizes UUID-suffix handling instead of repeating it per endpoint
- Gives a single place to extend path logic to new entities in the future
