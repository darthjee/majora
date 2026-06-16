# Add pagination to npcs page

## Context

The NPCs page (`/#/games/:game_slug/npcs`) currently loads all records at once with no pagination, degrading performance as the number of NPCs grows. The frontend already has all pagination infrastructure in place (component, helper, controller, client). Only the backend needs to be implemented.

## What needs to be done

- **Backend:** Add a `Settings` class with a `pagination_size` static method (reads `MAJORA_PAGINATION_SIZE` env var, defaults to 16). Create a reusable `Paginator` class that slices a queryset and sets response headers (`page`, `pages`, `per_page`, `total`). Apply it to the `game_npcs` endpoint.

## Acceptance criteria

- [ ] `game_npcs` endpoint accepts `page` and `per_page` query params
- [ ] Response headers include `page`, `pages`, `per_page`, `total`
- [ ] Default page size comes from `MAJORA_PAGINATION_SIZE` env var (fallback: 16)
- [ ] Results are ordered by `id`
- [ ] Pagination logic is in a reusable class usable by other endpoints
- [ ] All tests pass
