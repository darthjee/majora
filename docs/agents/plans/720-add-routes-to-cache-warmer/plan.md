# Plan: Add missing routes to the Navi cache warmer

Issue: [720-add-routes-to-cache-warmer.md](../../issues/720-add-routes-to-cache-warmer.md)

## Overview
The Navi cache warmer config is missing several endpoints (PC/NPC treasures, PC/NPC items,
game-level items) and warms two existing preview endpoints with a stale `per_page=6` instead
of `per_page=5`. Separately, the frontend's PC/NPC treasures/items preview fetches the endpoint's
default page and truncates client-side instead of requesting a bounded `per_page=5`, which
means there is no distinct URL for the cache warmer to warm for that preview. This plan fixes
the frontend fetch first, then adds/fixes the corresponding cache warmer entries.

## Agents involved

- [frontend](frontend.md)
- [infra](infra.md)

## Shared contracts

- **Preview page size**: `5` items, matching the existing `MAX_PREVIEW_ITEMS` constant
  (`frontend/assets/js/components/common/cards/characterPreviewConstants.js:9`) already used
  by the game-page PC/NPC preview (`GameController.js`).
- **URLs the frontend will request once its fix lands** (infra's warmer entries must match
  these exactly):
  - `/games/{:slug}/pcs/{:id}/treasures.json?per_page=5`
  - `/games/{:slug}/npcs/{:id}/treasures.json?per_page=5`
  - `/games/{:slug}/pcs/{:id}/items.json?per_page=5`
  - `/games/{:slug}/npcs/{:id}/items.json?per_page=5`
- **Existing routes with no preview/query variant needed** — full paginated lists only
  (already supported by the backend `Paginator`, no frontend change needed to warm these):
  - `/games/{:slug}/pcs/{:id}/treasures.json`
  - `/games/{:slug}/npcs/{:id}/treasures.json`
  - `/games/{:slug}/pcs/{:id}/items.json`
  - `/games/{:slug}/npcs/{:id}/items.json`
  - `/games/{:slug}/items.json`
- These two agents' changes are independent and can be implemented/merged in either order —
  infra's `per_page=5` warmer entries hit the same backend endpoints regardless of whether the
  frontend fix has landed yet (the backend already supports `per_page` on all these list
  endpoints); the frontend fix is what makes those entries actually match production traffic.
