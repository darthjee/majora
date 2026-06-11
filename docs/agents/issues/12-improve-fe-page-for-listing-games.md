# Issue: Improve FE Page for Listing Games

## Description

The current Games listing page (`frontend/assets/js/components/pages/Games.jsx`) is a bare-bones
stub that renders plain text with no styling, no game cards, and no real pagination UI. The page
should be improved to provide a polished user experience using Bootstrap, following the same
component architecture already established in the codebase (and proven in the sister project `oak`).

## Problem

- The Games page renders only raw text (`<div>Games ({games.length}) - page {pagination.page}</div>`)
- No Bootstrap classes are applied — the page is completely unstyled
- There is no card layout to display individual games
- Game images/photos are not shown
- The pagination state exists in the component but there is no pagination UI rendered
- There are no helper or dedicated rendering classes for the Games page

## Expected Behavior

- Each game is displayed as a Bootstrap card containing:
  - A cover image (or placeholder when none is available)
  - The game name
  - A link to the game's detail page
- Cards are arranged in a responsive Bootstrap grid (e.g. `col-sm-6 col-md-4 col-lg-3`)
- A pagination component is rendered below the card grid, matching the pattern used in `oak`:
  - Shows first/last pages, a sliding window around the current page, and ellipsis gaps
  - Previous/Next buttons disabled at boundaries
  - Active state on the current page
  - Navigation via hash-based URLs with `page` and `per_page` query params
- Loading and error states are handled with Bootstrap-styled feedback

## Solution

Follow the three-layer architecture from `oak` (already mirrored in this project):

1. **Helper class** — `GamesHelper.jsx` with static render methods for:
   - `render(games, pagination)` — main layout
   - `renderLoading()` — Bootstrap spinner or muted text
   - `renderError(error)` — Bootstrap alert

2. **Card components** — a `GameCard.jsx` presentational component using Bootstrap card markup
   (`card`, `card-body`, `card-title`, `img-fluid`, responsive columns)

3. **Pagination component set** — port/adapt from `oak`:
   - `Pagination.jsx` — presentational wrapper
   - `PaginationController.js` — builds page list with gap markers
   - `PaginationBuilder.js` — sliding-window algorithm (first 3, last 3, ±3 from current)
   - `PaginationHelper.jsx` — renders Bootstrap `<ul class="pagination">` with PageLink items
   - `PageLink.jsx` — URL-template-based link (e.g. `#/games?page=:page&per_page=:perPage`)

4. **Update `Games.jsx`** to use `GamesHelper` for all rendering branches (loading / error / success)

## Benefits

- Consistent look-and-feel with the rest of the application
- Reusable pagination infrastructure for future list pages (Characters, NPCs, etc.)
- Separation of concerns keeps the page component thin and all rendering logic testable in helpers

---
See issue for details: https://github.com/darthjee/majora/issues/12
