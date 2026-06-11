# Plan: Frontend — Bootstrap Layout, GameCard, and Pagination

## Overview

Improve the Games listing page with Bootstrap-styled game cards (including cover image) and a full
pagination UI. All new code follows the three-layer architecture: presentational components,
controllers, and helpers.

## Context

- `Games.jsx` already holds `games`, `pagination`, `loading`, and `error` state via
  `GamesController`, but renders only plain text.
- Bootstrap 5 and react-bootstrap are already listed as dependencies but not yet imported globally.
- The `oak` project has a complete, tested pagination component set that can be ported directly.
- `GenericClient.fetchIndex` already extracts `page`, `pages`, and `perPage` from response headers.
- After the backend change, the game object will include a `photo` URL field (nullable).

## Implementation Steps

### Step 1 — Import Bootstrap in main.jsx

Add to `frontend/assets/js/main.jsx`:

```js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

This makes Bootstrap styles and interactive components available application-wide.

### Step 2 — Create PageLink element

**`frontend/assets/js/components/elements/PageLink.jsx`**

Presentational anchor that accepts a URL template and a page number. Replaces `:page` and
`:perPage` placeholders to produce the final href:

```jsx
// basePath example: '#/games?page=:page&per_page=:perPage'
export default function PageLink({ basePath, page, perPage, children }) { … }
```

### Step 3 — Create PaginationBuilder

**`frontend/assets/js/components/elements/controllers/PaginationBuilder.js`**

Pure algorithm class. Given `currentPage` and `totalPages`, returns a sorted array of page numbers
with `null` inserted as a gap marker between non-consecutive groups.

Algorithm:
- Always include pages 1–3 and the last 3 pages
- Include the ±3 window around `currentPage`
- Insert `null` between any two groups that are not consecutive

### Step 4 — Create PaginationController

**`frontend/assets/js/components/elements/controllers/PaginationController.js`**

Thin wrapper around `PaginationBuilder`. Receives the `pagination` object `{ page, pages, perPage }`
and returns the page array ready for rendering.

### Step 5 — Create PaginationHelper

**`frontend/assets/js/components/elements/helpers/PaginationHelper.jsx`**

Static class with a `render(pagination, basePath)` method that produces:

```html
<nav aria-label="pagination">
  <ul class="pagination justify-content-center">
    <li class="page-item [disabled]"><a class="page-link">«</a></li>
    <!-- page numbers, nulls become disabled "…" items, active on current page -->
    <li class="page-item [disabled]"><a class="page-link">»</a></li>
  </ul>
</nav>
```

Uses `PageLink` for all navigable items.

### Step 6 — Create Pagination element

**`frontend/assets/js/components/elements/Pagination.jsx`**

Thin presentational wrapper that delegates to `PaginationHelper.render(pagination, basePath)`.

### Step 7 — Create GameCard element

**`frontend/assets/js/components/elements/GameCard.jsx`**

Bootstrap card component for a single game. Receives a `game` object:

```jsx
<div className="col-sm-6 col-md-4 col-lg-3 mb-4">
  <a href={`#/games/${game.game_slug}`} className="text-decoration-none text-dark">
    <div className="card h-100">
      {game.photo
        ? <img src={game.photo} className="card-img-top img-fluid" alt={game.name} />
        : <div className="card-img-top bg-light …">No image</div>}
      <div className="card-body">
        <h5 className="card-title">{game.name}</h5>
      </div>
    </div>
  </a>
</div>
```

### Step 8 — Create GamesHelper

**`frontend/assets/js/components/pages/helpers/GamesHelper.jsx`**

Static class with three render methods:

- `render(games, pagination)` — `container` > `row` of `GameCard` components + `Pagination`
  below the grid
- `renderLoading()` — `container` with muted centered text
- `renderError(error)` — `container` with Bootstrap `alert alert-danger`

### Step 9 — Update Games.jsx

Replace inline stubs with `GamesHelper` calls:

```jsx
if (loading) return GamesHelper.renderLoading();
if (error)   return GamesHelper.renderError(error);
return GamesHelper.render(games, pagination);
```

### Step 10 — Add Jasmine specs

Add spec files mirroring the `specs/` directory structure for every new file:

| Spec file | What to test |
|-----------|-------------|
| `specs/…/elements/PageLinkSpec.js` | Correct href from template + page/perPage |
| `specs/…/elements/controllers/PaginationBuilderSpec.js` | Page array, gap markers, boundary cases |
| `specs/…/elements/controllers/PaginationControllerSpec.js` | Delegates to PaginationBuilder correctly |
| `specs/…/elements/helpers/PaginationHelperSpec.js` | Renders prev/next, active page, ellipsis |
| `specs/…/elements/PaginationSpec.js` | Delegates to PaginationHelper |
| `specs/…/elements/GameCardSpec.js` | Renders image when present, placeholder when absent |
| `specs/…/pages/helpers/GamesHelperSpec.js` | All three render methods |

## Files to Change

- `frontend/assets/js/main.jsx` — add Bootstrap imports
- `frontend/assets/js/components/pages/Games.jsx` — delegate to GamesHelper
- `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` — **new**
- `frontend/assets/js/components/elements/GameCard.jsx` — **new**
- `frontend/assets/js/components/elements/Pagination.jsx` — **new**
- `frontend/assets/js/components/elements/PageLink.jsx` — **new**
- `frontend/assets/js/components/elements/controllers/PaginationController.js` — **new**
- `frontend/assets/js/components/elements/controllers/PaginationBuilder.js` — **new**
- `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` — **new**
- All spec files listed in Step 10 — **new**

## Notes

- The `basePath` passed to `Pagination` will be `'#/games'` with the query template appended;
  this must match the route registered in `HashRouteResolver` for the games index.
- The `photo` field on the game object comes from the backend change in `plan_backend.md` and will
  be `null` when no image has been set — `GameCard` must handle that gracefully.
