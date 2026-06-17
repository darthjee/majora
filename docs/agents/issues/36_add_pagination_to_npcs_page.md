# Issue: Add Pagination to NPCs Page

## Description
The NPCs page (`/#/games/:game_slug/npcs`) currently loads all records at once with no pagination, degrading performance as the number of NPCs grows. The frontend already has all pagination infrastructure in place (component, helper, controller, client). Only the backend needs to be implemented.

## Problem
- The NPCs endpoint returns all records with no limit or ordering
- No pagination headers are set on the response
- Performance degrades as the number of NPCs grows

## Expected Behavior

### Backend
- Add a `Settings` class with a `pagination_size` static method that reads the `MAJORA_PAGINATION_SIZE` env var and defaults to `16`
- Create a reusable `Paginator` class that slices a queryset and sets response headers: `page`, `pages`, `per_page`, `total`
- Apply the `Paginator` to the `game_npcs` endpoint

### Frontend
- Reads pagination headers from the API response
- Renders a reusable Bootstrap pagination component with ellipsis pattern when pages > 10:
  - General: `(1), (2), ..., (prev), (current), (next), ..., (last-1), (last)`
  - Near start (e.g. page 3): `(1), (2), (3), (4), ..., (last-1), (last)`
  - Near end: same logic in reverse
- Pagination uses hash-based routing:
  - `/#/games/:game_slug/npcs` → loads first page, links like `/#/games/:game_slug/npcs?page=N`
  - `/#/games/:game_slug/npcs?page=5` → loads `/games/:game_slug/npcs.json?page=5`
  - Query parameters are forwarded to the API as-is

### Documentation
- Update `docs/agents/` docs to describe pagination details

## Solution
- Implement `Settings.pagination_size` backend helper
- Implement reusable `Paginator` class and apply it to the NPCs endpoint
- Frontend pagination infrastructure is already in place — wire it to the NPCs page

## Benefits
- Better performance by limiting data fetched per request
- Consistent, reusable pagination infrastructure for future endpoints

---
See issue for details: https://github.com/darthjee/majora/issues/36
