# Issue: Game content copy: Common items tab

## Description
Part of "copy content between games" (epic #1550): the **Common items** tab.

Design source of truth: the specs under `docs/agents/specs/game-content-copy/` (index `docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win. Implements `common-items.md` on top of the global pages (`copy-flow.md`, `hard-links.md`, `permissions.md`, `page.md`).

## Expected Behavior
- Backend: a `common_items` copy type over `GameCommonItem`, registered in the generic `staff/copies` dispatch right after `items` (spec tab order).
  - `GET staff/copies/common_items.json?from=&to=`: paginated, ordered by `id`, every common item of the source game (hidden ones included), with row fields `id`, `name`, `category` (raw choice value), `price`, `hidden`, `photo` (only when the cover is ready, else null) and `copied_to_target`.
  - `POST staff/copies/common_items/<id>.json {target}`: copies `name`, `price`, `description`, `category` and `hidden`, sets `game` to the target and `copied_from` to the source, all in one transaction, and returns `{id, links}` (0 or 1 link). `photo` stays null until the link finalizes. Name clashes are allowed (never `422`). `GameRecipe` rows and history are not copied.
- Cover link: only the source's `photo`, and only when it is ready. It becomes one `GameCommonItemPhoto` (`ready=false`) at `photos/games/<target-slug>/common_items/<copy-id>/photo<ext>`, with one copy-origin `Upload` (`upload_type=image`, `is_cover=true`). Other `GameCommonItemPhoto` rows are ignored. If there is no cover, or it isn't ready, the item is copied without a link. `CopyLinkFinalizer` sets the copy's `photo` FK. The pending-links query reaches the game through `game_common_item__game`.
- `X-Cache-Clear` on the copy `201` and on link finalize, cleared on every domain: the target's common item family (`common_items.json`, `common_items/all.json`, `common_items/<copy-id>.json`, `common_items/<copy-id>/full.json`) via `GameResourceCachePaths('common_items', **FULL_FAMILY)`. Common items have no character links, so no `available.json` paths are needed, and a fresh copy needs no `recipes*.json` clearing.
- The copy logic stays reusable so that the Recipes tab (#1574) can copy a recipe's common item under exactly these rules.
- Frontend: this tab's row component with checkbox, cover thumbnail (placeholder when there is no photo), name, category (translated with the existing `common_item_page.category.<value>` keys), price, hidden badge, and "already copied" flag.

## Solution
- Follow the merged Items tab (#1572) pattern: `backend/staff/copy_types_items.py` (`ModelCopyType`, `CoverPhotoLinkBuilder`, `copy_cache_paths.py`) and its row serializer and frontend row component.
- Agents: `backend` and `frontend` (+ `translator` only if any new keys are needed; category labels already exist). Reviews: `data-access` and `security`. `cache` confirms the `X-Cache-Clear` paths and that no Navi resource is needed.
- Tests: the per-type cases in the spec's "Testing" section.

### Depends on
#1572 (Items tab), already merged.

## Benefits
Staff can copy Common items between games, and the Recipes tab gets a common-item copy it can reuse.
