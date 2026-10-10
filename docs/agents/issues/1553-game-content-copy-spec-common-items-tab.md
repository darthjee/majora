# Issue: Game content copy spec: Common items tab

## Description
Part of the "copy content between games" epic (#1550). Write the **Common items** tab page of the game-content-copy spec, `docs/agents/specs/game-content-copy/common-items.md`, and link it from the index `docs/agents/specs/game-content-copy.md` (replacing the pending "Common items — #1553" entry). Docs only, no code changes.

The shared rules (page, copy flow, `copied_from`, `hidden` kept as source, cover set at link finalize, `Upload` link kind, proxy link handler, pending/failed links, permissions) live in the global pages written by #1551 (`page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`, already merged). The page must **reference** them, not repeat them, and only add what is specific to `GameCommonItem`. It follows the structure of the already-merged Items page (`items.md`, #1552).

## Problem
The global spec leaves per-type details to the tab pages: which fields and associated rows are copied, how the photo path is built, the list endpoint row fields and the frontend columns. Without the Common items page, the implementation issue for this tab has no definition to follow — and the Recipes tab (#1554), which copies a recipe's common item when the target has no copy of it yet, defers to "the Common items rules".

## Expected Behavior
`common-items.md` defines, for tab slug `common_items` (model `GameCommonItem`, `backend/games/models/game/game_common_item.py`):

- **Copied fields**: `name`, `price`, `description`, `category`, `hidden` (kept as source); `game` = target; `copied_from` = source; `photo` null at copy time.
- **Not copied**: recipes (`GameRecipe.game_common_item` pointing to the source — the Recipes tab copies a recipe's common item, never the other way round), history.
- **Photo**: a `GameCommonItem` has **at most one** photo (`game_common_item_photo_upload` reuses the cover row, fixed path `games/<slug>/common_items/<id>/photo<ext>`, no uuid). Only the source's cover `photo`, when `ready=true`, is copied; any other `GameCommonItemPhoto` row (e.g. a legacy orphan) is ignored, since it would collide on the same target path. The cover becomes one `GameCommonItemPhoto` row (`ready=false`) at `photos/games/<target-slug>/common_items/<copy-id>/photo<ext>` (extension kept from the source path, `root='photos'`), with one copy-origin `Upload` (`upload_type=image`, `is_cover=true`). Its finalize (`CopyLinkFinalizer`) sets the copy's `photo` FK; `_set_common_item_photo` does not run. A source with no photo, or whose cover is not ready, is copied with no photo and no link.
- **Names**: clashes in the target game are allowed (no unique constraint), never a `422` for names.
- **Endpoints**: `GET staff/copies/common_items.json?from=&to=` and `POST staff/copies/common_items/<id>.json` (global shape; `links` holds 0 or 1 entry). List rows: `{id, name, category, price, hidden, photo, copied_to_target}`, where `photo` is the ready cover path or null. Every source common item is listed, hidden ones included, ordered by `id`. The pending-links query reaches the game through `GameCommonItemPhoto.game_common_item__game`.
- **Cache**: the copy `201` and the cover finalize send `X-Cache-Clear` for the target game's common item family (`/games/<target>/common_items.json`, `/common_items/all.json`, `/common_items/<copy-id>.json`, `/common_items/<copy-id>/full.json`), built by reusing `GameResourceCachePaths('common_items', **FULL_FAMILY)` like the staff photo type `game_common_item` (`backend/staff/photo_types.py`).
- **Recipes tab interaction**: a common item copied as a recipe dependency (#1554) follows exactly these rules (fields, cover link, `copied_from`), so it is later flagged here as already copied.
- **Frontend**: columns are checkbox, cover thumbnail (placeholder when none), name, category (translated), price, hidden badge, and the "already copied" flag.
- **Testing**: per-type backend/frontend cases on top of the global strategy (mirroring `items.md`, plus `price`/`category` copied and listed, and recipes not copied).
