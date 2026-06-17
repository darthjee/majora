# Add pagination to other index pages

## Context

Following the pagination work from issue #36 (NPCs page), the same pagination support needs to be applied to the other index endpoints: `GET /games.json` (games list) and `GET /games/:game_slug/pcs.json` (player characters list). The frontend for both pages already has the full pagination infrastructure in place (fetchIndex, pagination state, Pagination component). Only the backend needs updating.

## What needs to be done

- **Backend:** Apply the existing `Paginator` class to the `games_list` and `game_pcs` views. Add tests for both endpoints.

## Acceptance criteria

- [ ] `GET /games.json` returns paginated results with `page`, `pages`, `per_page`, `total` headers
- [ ] `GET /games/:game_slug/pcs.json` returns paginated results with the same headers
- [ ] Both endpoints respect `page` and `per_page` query params
- [ ] Default page size comes from `Settings.pagination_size()`
- [ ] All tests pass
