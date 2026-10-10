# Issue: Game content copy spec: Items tab

## Description
Part of the "copy content between games" epic (#1550). Write the **Items** tab page of the game-content-copy spec, `docs/agents/specs/game-content-copy/items.md`, and link it from the index `docs/agents/specs/game-content-copy.md` (replacing the pending "Items — #1552" entry). Docs only, no code changes.

The shared rules (page, copy flow, `copied_from`, `hidden` kept as source, cover set at link finalize, `Upload` link kind, proxy link handler, pending/failed links, permissions) live in the global pages written by #1551 (`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`, already merged). The Items page must **reference** them, not repeat them, and only add what is specific to `GameItem`.

## Problem
The global spec leaves per-type details to the tab pages: which fields and associated rows are copied, how the photo path is built, the list endpoint row fields and the frontend columns. Without the Items page, the implementation issue for this tab has no definition to follow.

## Expected Behavior
`items.md` defines, for tab slug `items` (model `GameItem`):

- **Copied fields**: `name`, `description`, `hidden` (kept as source); `game` = target; `copied_from` = source; `photo` null at copy time.
- **Not copied**: `CharacterItem` rows (and their `CharacterItemPhoto` overrides), history.
- **Photo**: a `GameItem` has at most one photo (the upload view reuses the same row, fixed path `games/<slug>/items/<id>/photo<ext>`, no uuid). Only the source's cover `photo`, when `ready=true`, is copied; any other `GameItemPhoto` row of the item (e.g. a legacy orphan) is ignored, since it would collide on the same target path. The cover becomes one `GameItemPhoto` row (`ready=false`) at `games/<target-slug>/items/<copy-id>/photo<ext>` (extension kept from the source path, `root='photos'`), with one copy-origin `Upload` (`upload_type=image`, `is_cover=true`). Its finalize sets the copy's `photo` FK. A source with no photo, or whose cover is not ready (re-upload in progress), is copied with no photo and no link.
- **Names**: clashes in the target game are allowed (no unique constraint), never a `422` for names.
- **Endpoints**: `GET staff/copies/items.json?from=&to=` and `POST staff/copies/items/<id>.json` (global shape). List rows: `{id, name, hidden, photo, copied_to_target}`, where `photo` is the ready cover path or null. Every source item is listed, hidden ones included. The pending-links query reaches the game through `GameItemPhoto.game_item__game`.
- **Cache**: the `X-Cache-Clear` paths of the target game's item resources (same family as the staff photo type `game_item`: `GameResourceCachePaths('items', **FULL_FAMILY)`).
- **Frontend**: columns are checkbox, cover thumbnail (placeholder when none), name, hidden badge, and the "already copied" flag.
- **Testing**: the per-type backend/frontend cases to add on top of the global strategy.
