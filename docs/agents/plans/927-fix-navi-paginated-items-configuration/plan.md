# Plan: Fix navi paginated items configuration

Issue: [927-fix-navi-paginated-items-configuration.md](../issues/927-fix-navi-paginated-items-configuration.md)

## Overview

Navi's cache-warming config only requests `page={page}` for paginated resources, while production always requests `page={page}&per_page={per_page}` (the frontend reads `per_page` from the first response's header). Because CDN cache keys are built from the full query string, Navi's warm requests never match real traffic. This plan adds `per_page` extraction/forwarding to every paginated block in `navi/resources/*.yml`, using the `parameters` field Navi `v1.5.1` adds to `paginated_actions` (tracked upstream as `darthjee/navi#621`).

## Context

`per_page` is dynamic (backend `Paginator` echoes it back on every response, defaulting to the env-configurable `MAJORA_PAGINATION_SIZE`), so it can't be hardcoded — it must be read from `headers['per_page']` on the same response that provides the page count, and threaded into each paginated request. This is a config-only change; no code changes are needed in `majora` itself, and the `warm-up-cache` CircleCI job already runs `darthjee/navi-hey:latest`, so no version pin needs touching.

Per the `v1.5.1` contract (`future-plan.md` in `darthjee/navi`), configs written with the `parameters` field are backward compatible: against Navi `<= 1.5.0`, an unrecognized `parameters` field is simply ignored (not an error). That means this config change is safe to merge ahead of the `v1.5.1` release — it will silently no-op until Navi is upgraded, then activate automatically once `warm-up-cache` picks up the new `:latest` image.

## Implementation Steps

### Step 1 — Add `parameters: { per_page: headers['per_page'] }` to every `paginated_actions` entry

For each of the 18 `paginated_actions` entries below, add a `parameters` field as a **sibling** of `pagination` (not nested inside its list):

```yaml
paginated_actions:
  - resource: <paginated_target>
    pagination:
      - pages: headers['pages']
      - page_key: page
      - zero_indexed: false
    parameters:
      per_page: headers['per_page']
```

Triggering resource → paginated target, by file:

- `navi/resources/treasures.yml`:
  - `treasures` → `paginated_treasures`
- `navi/resources/games.yml`:
  - `games` → `paginated_games`
  - `game_pcs` → `paginated_game_pcs`
  - `game_npcs` → `paginated_game_npcs`
  - `game_treasures` → `paginated_game_treasures`
  - `game_items` → `paginated_game_items`
  - `game_documents` → `paginated_game_documents`
  - `game_sessions` (past) → `paginated_game_sessions_past`
  - `game_sessions` (future) → `paginated_game_sessions_future`
  - `game_sessions` (unscheduled) → `paginated_game_sessions_unscheduled`
- `navi/resources/pcs.yml`:
  - `pc_photos` → `paginated_pc_photos`
  - `pc_treasures` → `paginated_pc_treasures`
  - `pc_items` → `paginated_pc_items`
  - `pc_documents` → `paginated_pc_documents`
- `navi/resources/npcs.yml`:
  - `npc_photos` → `paginated_npc_photos`
  - `npc_treasures` → `paginated_npc_treasures`
  - `npc_items` → `paginated_npc_items`
  - `npc_documents` → `paginated_npc_documents`

Do **not** touch the `short_*` resources (e.g. `short_pc_photos`, `short_game_document_files`) — those intentionally use small, fixed `per_page` values for preview lists and are unrelated to this fix.

### Step 2 — Add `&per_page={:per_page}` to every paginated target's URL template

For each `<paginated_target>` listed in Step 1, extend its own `url` entry to include the new placeholder, e.g.:

```yaml
paginated_treasures:
  - url: /treasures.json?page={:page}&per_page={:per_page}
    status: 200
    ...
```

Apply the same `&per_page={:per_page}` suffix to all 18 corresponding `paginated_*` resources' `url` fields, preserving any existing `actions` blocks under them unchanged.

## Files to Change

- `navi/resources/treasures.yml` — 1 `paginated_actions` block + 1 URL template
- `navi/resources/games.yml` — 9 `paginated_actions` blocks + 9 URL templates
- `navi/resources/pcs.yml` — 4 `paginated_actions` blocks + 4 URL templates
- `navi/resources/npcs.yml` — 4 `paginated_actions` blocks + 4 URL templates

## Notes

- This depends on `darthjee/navi#621` shipping as `v1.5.1`; until then the `parameters` field is inert (ignored, not an error) against the currently-published `1.5.0`, so merging this change early is safe.
- No automated verification is planned for this fix (deferred to future work, per the issue).
- Header names must be lowercase in path expressions (`headers['per_page']`), regardless of how the server cased the header — a Node.js normalization detail already followed by the existing `headers['pages']` usage in these files.
