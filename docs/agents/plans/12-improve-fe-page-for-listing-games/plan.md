# Plan: Improve FE Page for Listing Games

## Overview

Improve the Games listing page from a bare-bones stub into a polished Bootstrap-styled page with
game cards and full pagination UI. All new code follows the three-layer architecture already
established in the project (and proven in the sister project `oak`): presentational components,
controllers, and helpers.

## Context

- `Games.jsx` already fetches data via `GamesController` and holds `games`, `pagination`, `loading`,
  and `error` state — but renders only plain text.
- Bootstrap 5 and react-bootstrap are already installed as dependencies.
- The `oak` project has a complete, tested pagination component set that can be ported directly.
- The `GenericClient.fetchIndex` already extracts pagination metadata from response headers.

## Implementation Steps

### Step 1 — Import Bootstrap in main.jsx

Add the Bootstrap CSS and JS bundle imports to `frontend/assets/js/main.jsx` so styles are
available application-wide.

### Step 2 — Create the Pagination element set

Port the pagination infrastructure from `oak`, adapting naming and paths for this project:

- **`PageLink.jsx`** — presentational anchor component that accepts a URL template string
  (e.g. `#/games?page=:page&per_page=:perPage`) and a page number, replacing the `:page` and
  `:perPage` placeholders to produce the final href.

- **`PaginationBuilder.js`** — pure algorithm class: given `currentPage` and `totalPages`,
  returns a sorted array of page numbers to display, inserting `null` as a gap marker between
  non-consecutive groups. Algorithm: always include the first 3 and last 3 pages, plus the
  ±3 window around the current page.

- **`PaginationController.js`** — thin wrapper around `PaginationBuilder`; receives the
  `pagination` object and returns the page list ready for rendering.

- **`PaginationHelper.jsx`** — static class with a `render(pagination, basePath)` method that
  produces the Bootstrap `<nav><ul class="pagination justify-content-center">…</ul></nav>` markup:
  previous/next buttons (disabled at boundaries), numbered page items (active on current page),
  and disabled ellipsis items for gaps.

- **`Pagination.jsx`** — thin presentational wrapper that delegates to `PaginationHelper.render`.

### Step 3 — Create the GameCard element

**`GameCard.jsx`** — presentational Bootstrap card component. Receives a `game` object and renders:
- Cover image (`img-fluid`) if `game.photo` is present, or a placeholder otherwise
- Game name as `card-title`
- The card wrapped in a responsive column (`col-sm-6 col-md-4 col-lg-3`) with a link to the game's
  detail hash route (`#/games/:slug`)

### Step 4 — Create GamesHelper

**`frontend/assets/js/components/pages/helpers/GamesHelper.jsx`** — static class with:
- `render(games, pagination)` — Bootstrap `container` > `row` of `GameCard` components, followed
  by `Pagination` below the grid
- `renderLoading()` — muted text or spinner inside a container
- `renderError(error)` — Bootstrap `alert alert-danger` inside a container

### Step 5 — Update Games.jsx

Replace the inline render stubs in `Games.jsx` with calls to `GamesHelper`:
- `if (loading)` → `return GamesHelper.renderLoading()`
- `if (error)` → `return GamesHelper.renderError(error)`
- main return → `return GamesHelper.render(games, pagination)`

### Step 6 — Add Jasmine specs

Add spec files mirroring the `specs/` directory structure for every new file:
- `specs/assets/js/components/elements/PageLinkSpec.js`
- `specs/assets/js/components/elements/controllers/PaginationBuilderSpec.js`
- `specs/assets/js/components/elements/controllers/PaginationControllerSpec.js`
- `specs/assets/js/components/elements/helpers/PaginationHelperSpec.js`
- `specs/assets/js/components/elements/PaginationSpec.js`
- `specs/assets/js/components/elements/GameCardSpec.js`
- `specs/assets/js/components/pages/helpers/GamesHelperSpec.js`

## Files to Change

- `frontend/assets/js/main.jsx` — add Bootstrap CSS/JS imports
- `frontend/assets/js/components/pages/Games.jsx` — delegate rendering to GamesHelper
- `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` — **new** — three render methods
- `frontend/assets/js/components/elements/GameCard.jsx` — **new** — Bootstrap card for a game
- `frontend/assets/js/components/elements/Pagination.jsx` — **new** — pagination wrapper
- `frontend/assets/js/components/elements/PageLink.jsx` — **new** — URL-template link
- `frontend/assets/js/components/elements/controllers/PaginationController.js` — **new**
- `frontend/assets/js/components/elements/controllers/PaginationBuilder.js` — **new**
- `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` — **new**
- Spec files for all of the above — **new**

## Notes

- The `Game` model exposes `game_slug` as the URL-safe identifier; the route should use that field.
- It is not yet defined whether the API returns a `photo` field directly on the game object or
  requires a separate request. This needs to be confirmed by inspecting the `GameListSerializer`.
- The `basePath` passed to `PaginationHelper` (and `PageLink`) will be `#/games` with the query
  template appended — this must align with whatever route is registered in `HashRouteResolver`.
