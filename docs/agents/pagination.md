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

`source/games/paginator.py` — reusable class applied to any list view:

```python
paginator = Paginator(request, queryset)
page_qs, headers = paginator.paginate()
return Response(serializer.data, headers=headers)
```

**Query params accepted:**
| Param | Description | Default |
|-------|-------------|---------|
| `page` | Page number (1-based) | `1` |
| `per_page` | Items per page | `Settings.pagination_size()` |

**Response headers set:**
| Header | Description |
|--------|-------------|
| `page` | Current page number |
| `pages` | Total number of pages |
| `per_page` | Items per page used |
| `total` | Total item count |

Results are ordered by `id` via the model's `Meta.ordering`.

### Endpoints with pagination

| Endpoint | View |
|----------|------|
| `GET /games.json` | `games_list` |
| `GET /games/:game_slug/pcs.json` | `game_pcs` |
| `GET /games/:game_slug/npcs.json` | `game_npcs` |

---

## Frontend

### Client

`GenericClient.fetchIndex(path)` reads the pagination headers and returns:

```js
{ data: [...], pagination: { page, pages, perPage } }
```

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
