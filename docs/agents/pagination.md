# Pagination

## Overview

Pagination is applied to collection endpoints that can return large result sets. The backend slices the queryset and sets response headers; the frontend reads those headers and renders a Bootstrap pagination component.

---

## Backend

### Settings

`source/games/settings.py` — `Settings.pagination_size()` returns the default page size:

```python
Settings.pagination_size()  # reads MAJORA_PAGINATION_SIZE env var, defaults to 16
```

### Paginator

`source/games/paginator.py` — a reusable `Paginator` class applied to any list view. It
reads `page`/`per_page` query params (defaulting to `1` and `Settings.pagination_size()`),
slices the queryset, and sets `page`/`pages`/`per_page`/`total` response headers. Results
are ordered by `id` via the model's `Meta.ordering`. Read the class directly for the exact
call signature.

### Endpoints with pagination

| Endpoint | View |
|----------|------|
| `GET /games.json` | `games_list` |
| `GET /games/:game_slug/pcs.json` | `game_pcs` |
| `GET /games/:game_slug/npcs.json` | `game_npcs` |
| `GET /games/:game_slug/treasures.json` | `game_treasures` |
| `GET /games/:game_slug/sessions.json` | `game_sessions_list` |

---

## Frontend

### Client

`GenericClient.fetchIndex(path)` reads the pagination response headers and returns
`{ data, pagination: { page, pages, perPage } }`.

### URL params

`HashRouteResolver.getPaginationParams()` reads `page` and `per_page` from the hash URL and forwards them to the API. Example:

```
/#/games/epic-quest/npcs?page=3&per_page=20
→ GET /games/epic-quest/npcs.json?page=3&per_page=20
```

### Pagination component

`<Pagination currentPage={N} totalPages={N} perPage={N} basePath="..." />`

Renders a Bootstrap pagination nav. Hidden when `totalPages <= 1`.

**Ellipsis pattern (when pages > 10):**
- General: `« 1 2 … prev current next … last-1 last »`
- Near start (e.g. page 3): `« 1 2 3 4 … last-1 last »`
- Near end: same logic in reverse

Links use the pattern: `{basePath}?page=N&per_page=M`

### Key files

| File | Role |
|------|------|
| `frontend/assets/js/client/GenericClient.js` | Reads pagination headers |
| `frontend/assets/js/utils/HashRouteResolver.js` | Extracts page/per_page from hash URL |
| `frontend/assets/js/components/elements/Pagination.jsx` | Pagination component |
| `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` | Renders Bootstrap nav |
| `frontend/assets/js/components/elements/controllers/PaginationController.js` | Builds page list with ellipsis |
| `frontend/assets/js/components/elements/controllers/PaginationBuilder.js` | Builds page link URLs |
