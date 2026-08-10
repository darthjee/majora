# Plan: Add more cache warms

Issue: [1051-add-more-cache-warms.md](../issues/1051-add-more-cache-warms.md)

## Overview

Add `/games/{slug}/photos.json` to the Navi cache warmer. This is the only endpoint identified during discussion as both public/read-only and currently missing from the warm-up chain; everything else considered (`/all.json`, `/full.json`, permission-scoped endpoints, deferred candidates like tasks/polls/session messages) is explicitly out of scope for this issue.

## Context

`navi/resources/games.yml` already warms `/games.json` down through each game's detail, PCs, NPCs, treasures, items, documents, and sessions, as sibling actions fanned out from `paginated_games`. `game_photos.json` (`backend/games/views/games/game_photos.py`) is a `GET`, `AllowAny`, paginated-list endpoint (`paginated_list_response`) with no per-photo detail route and no "short" preview variant used by the frontend (`GamePhotosController` fetches the full paginated list directly) — so it needs the exact same treatment as `game_items`/`game_treasures`: a paginated resource, no nested detail action, default page size.

## Implementation Steps

### Step 1 — Add `game_photos` as an action off `paginated_games`

In `navi/resources/games.yml`, add a `game_photos` entry to `paginated_games`'s `actions` list (around line 15-40), alongside `game_detail`, `game_pcs`, `game_npcs`, `game_treasures`, `game_items`, `game_documents`, `game_sessions`:

```yaml
        - resource: game_photos
          parameters:
            slug: parsedBody.game_slug
```

### Step 2 — Define the `game_photos` and `paginated_game_photos` resources

In the same file, add two new top-level resources mirroring `game_items`/`paginated_game_items` exactly (no `actions`, since there's no per-photo detail route):

```yaml
  game_photos:
    - url: /games/{:slug}/photos.json
      status: 200
      paginated_actions:
        - resource: paginated_game_photos
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['per_page']

  paginated_game_photos:
    - url: /games/{:slug}/photos.json?page={:page}&per_page={:per_page}
      status: 200
```

### Step 3 — Update `docs/agents/cache-warmer.md`

Amend the `games.yml` bullet in the "Configuration" section's file list to mention photos alongside PCs/NPCs/treasures/items/documents/sessions, so the doc stays in sync with the actual warm-up chain.

## Files to Change

- `navi/resources/games.yml` — add the `game_photos` action under `paginated_games`, plus the new `game_photos`/`paginated_game_photos` resource definitions.
- `docs/agents/cache-warmer.md` — update the `games.yml` description to include photos.

## Notes

- No detail resource and no `short_*` variant are needed — confirmed there's no per-photo detail GET route, and the frontend's `GamePhotosController` doesn't use a shortlist/preview fetch for game photos.
- Explicitly out of scope (per issue discussion): every `/all.json`/`/full.json` variant, `treasures/missing.json`, `tasks.json`, `polls.json`/`polls/{id}.json`/`polls/{id}/votes.json`, `sessions/{id}/messages.json`, and all permission/user-scoped endpoints (`access.json`, `/summary.json`, `/summary/all.json`).
- No CI job directly validates `navi/resources/*.yml` locally (CI only pushes the config during the post-release `warm-up-cache` job); double-check YAML validity by hand or with `python3 -c "import yaml; yaml.safe_load(open('navi/resources/games.yml'))"`.
