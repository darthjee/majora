# Infra Plan: Add missing routes to the Navi cache warmer

Main plan: [plan.md](plan.md)

## Shared contracts

- Frontend will request (once its fix lands, but these are valid warmable URLs regardless,
  since the backend already supports `per_page` on every list endpoint below):
  - `/games/{:slug}/pcs/{:id}/treasures.json?per_page=5`
  - `/games/{:slug}/npcs/{:id}/treasures.json?per_page=5`
  - `/games/{:slug}/pcs/{:id}/items.json?per_page=5`
  - `/games/{:slug}/npcs/{:id}/items.json?per_page=5`

## Implementation Steps

### Step 1 — Fix the stale `per_page` on the existing game-page previews

In `.circleci/navi_config.yaml`, `short_game_pcs` (line 82) and `short_game_npcs` (line 86)
currently warm `per_page=6`, but the frontend's game-page preview now requests `per_page=5`
(`GameController.js`). Update both:
- `short_game_pcs`: `/games/{:slug}/pcs.json?per_page=6` -> `/games/{:slug}/pcs.json?per_page=5`
- `short_game_npcs`: `/games/{:slug}/npcs.json?per_page=6` -> `/games/{:slug}/npcs.json?per_page=5`

### Step 2 — Add full paginated resources for treasures/items

Mirror the existing `pc_photos`/`npc_photos` (lines 207-219/230-242) and `game_treasures`
(lines 127-139) patterns. Add, chained as actions of `pc` (line 198) and `npc` (line 221)
respectively — use the real backend routes (`/pcs/{:id}/...`, not `/pcs.json/{:id}/...`):

- `pc_treasures`: `/games/{:slug}/pcs/{:id}/treasures.json`, paginated via
  `paginated_pc_treasures` (`?page={:page}`), added as an action on `pc`.
- `npc_treasures`: `/games/{:slug}/npcs/{:id}/treasures.json`, paginated via
  `paginated_npc_treasures` (`?page={:page}`), added as an action on `npc`.
- `pc_items`: `/games/{:slug}/pcs/{:id}/items.json`, paginated via `paginated_pc_items`
  (`?page={:page}`), added as an action on `pc`.
- `npc_items`: `/games/{:slug}/npcs/{:id}/items.json`, paginated via `paginated_npc_items`
  (`?page={:page}`), added as an action on `npc`.

Follow the exact `paginated_actions` / `pagination` (`pages: headers['pages']`, `page_key: page`,
`zero_indexed: false`) shape already used by `game_treasures`/`paginated_game_treasures`
(lines 127-139).

### Step 3 — Add game-level items resource

Add `game_items`: `/games/{:slug}/items.json`, following the exact shape of `game_treasures`
(paginated via `paginated_game_items`), chained as an additional action of `paginated_games`
(lines 50-68), alongside the existing `game_treasures` action.

### Step 4 — Add the `per_page=5` preview resources

Mirror `short_game_pcs`/`short_game_npcs` (lines 81-87) — no pagination, single request per
resource. Add, chained as further actions of `pc`/`npc` alongside the resources from Step 2:

- `short_pc_treasures`: `/games/{:slug}/pcs/{:id}/treasures.json?per_page=5`
- `short_npc_treasures`: `/games/{:slug}/npcs/{:id}/treasures.json?per_page=5`
- `short_pc_items`: `/games/{:slug}/pcs/{:id}/items.json?per_page=5`
- `short_npc_items`: `/games/{:slug}/npcs/{:id}/items.json?per_page=5`

Land this only once (or concurrently with, but not before verifying) the frontend's
`per_page=5` default from [frontend.md](frontend.md) is confirmed, so this stays a real
warmable match rather than a warmer entry with no corresponding frontend traffic.

## Files to Change
- `.circleci/navi_config.yaml` — fix `per_page=6` -> `per_page=5` on `short_game_pcs`/
  `short_game_npcs`; add `pc_treasures`, `npc_treasures`, `pc_items`, `npc_items`,
  `game_items` (each with its `paginated_*` counterpart), and `short_pc_treasures`,
  `short_npc_treasures`, `short_pc_items`, `short_npc_items`.

## CI Checks
- No dedicated CI job validates `navi_config.yaml` syntax/semantics before merge — the
  `warm-up-cache` job (`.circleci/config.yml:425`) only runs `navi-hey --config
  .circleci/navi_config.yaml` against production, after a version-tag release. Validate the
  YAML locally (e.g. `docker-compose up majora_navi` per `docs/agents/cache-warmer.md`'s
  "Local testing" section, pointed at a local/dev `MAJORA_PRODUCTION_URL`) before merging.

## Notes
- The raw issue text had malformed URLs (e.g. `/games/{:slug}/pcs.json/{:id}/treasures.json`)
  — confirmed against `backend/games/urls/` that the real routes are `/pcs/{:id}/treasures.json`
  etc.; use those, not the literal strings from the original issue.
- `items` and `treasures` are distinct resources/models on both PC/NPC and game — do not merge
  or alias them.
