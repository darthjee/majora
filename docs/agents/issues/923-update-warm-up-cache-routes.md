# Issue: Update warm-up-cache routes

## Description
On CI deployment, a cache warmer ([Navi](../external/HOW_TO_USE_NAVI.md), see `docs/agents/external/HOW_TO_USE_NAVI.md`) runs after the deployment, using route configuration defined in `.circleci/navi_config.yaml`.

### Crawling flow
- Crawling starts from `resources` that take no parameters (no `{:page}`, `{:slug}`, `{:id}`, etc.).
- **Paginated**: once a resource is fetched, it can trigger further paginated crawling via `paginated_actions` (e.g. `paginated_treasures`).
- **Show/details endpoint**: listings and paginated resources can trigger a single-entity view through `actions` (e.g. `paginated_treasures` triggers `treasure_detail`).
- **Nested resources**: from a show/details endpoint (or directly from a listing) further nested resources can be requested through `actions` (e.g. `paginated_games` triggers `game_pcs`; `game_detail` triggers `short_game_pcs`).

## Problem
Not all resources are currently present in `.circleci/navi_config.yaml` — some API endpoints are never warmed by the cache warmer.

## Solution
- Add the missing resources listed below to `.circleci/navi_config.yaml`.
- Introduce a new, dedicated **cache agent** specialist (a new `.claude/agents/cache.md`, alongside the existing `security`/`data-access`/etc. specialists) responsible for keeping the cache warmer configuration correct and complete going forward.
- Move ownership of `.circleci/navi_config.yaml` (and the Navi cache-warmer documentation section) from the `infra` agent to the new `cache` agent. Update `infra.md` to drop that responsibility and delegate to the `cache` agent, the same way `infra` already delegates PHP proxy work to the `proxy` agent.

### Missing resources (no pagination parameters)
- `game_document_details`: `/games/{:slug}/documents/{:id}.json`
  - triggers `game_document_files`
  - triggers `game_document_photos`
  - triggers `short_game_document_files`
  - triggers `short_game_document_photos`
- `game_document_files`: `/games/{:slug}/documents/{:id}/files.json`
- `game_document_photos`: `/games/{:slug}/documents/{:id}/photos.json`
- `short_game_document_files`: `/games/{:slug}/documents/{:id}/files.json?per_page=17`
- `short_game_document_photos`: `/games/{:slug}/documents/{:id}/photos.json?per_page=17`

### Cache agent responsibilities
- Own and maintain `.circleci/navi_config.yaml` (edit rights, like `infra` has today):
  - Include only regular endpoints, paginated resources, nested resources, and `short_*` resources (mirroring shortlist requests made by the frontend).
  - NEVER include mutation endpoints.
  - NEVER include restricted endpoints — except when the same endpoint has both a regular and a restricted form (e.g. `/games.json`), in which case it is included.
- Verify that restricted endpoints always carry the `X-Skip-Cache` header. This check is **read-only**: like the `security`/`data-access` agents, the cache agent reports violations to the architect rather than editing backend/proxy code itself.

### Out of scope
- Adding the missing paginated items — paginated items currently have a small bug that needs to be fixed first.
- Removing any existing paginated items — despite the bug, there is no reason to remove them.
