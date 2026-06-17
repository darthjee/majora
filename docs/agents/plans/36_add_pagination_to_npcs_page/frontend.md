# Frontend Plan: Add pagination to npcs page

Main plan: [plan.md](plan.md)

## Shared contracts

The NPCs endpoint (`GET /games/:game_slug/npcs.json`) returns these response headers:
- `page` — current page (integer)
- `pages` — total pages (integer)
- `per_page` — items per page (integer)
- `total` — total item count (integer)

The frontend reads headers via `GenericClient.fetchIndex`, which parses `page`, `pages`, and `per_page` from the response. Links use hash-based routing: `#/games/:game_slug/npcs?page=N&per_page=M`.

## Tasks

The full pagination infrastructure is already implemented. Verify and confirm:

1. `GenericClient.fetchIndex` reads `page`, `pages`, `per_page` headers and returns them as `{ data, pagination }`
2. `HashRouteResolver.getPaginationParams()` forwards `page` and `per_page` from the hash URL to the API
3. `GameNpcsController.buildEffect()` calls `fetchIndex` and passes `pagination` to `setPagination`
4. `GameNpcs.jsx` passes `pagination` to `GameCharactersHelper.render(...)`
5. `GameCharactersHelper.render(...)` renders `<Pagination currentPage={...} totalPages={...} perPage={...} basePath={...} />`
6. `PaginationHelper` renders Bootstrap nav with ellipsis pattern (via `PaginationController`)
7. All Jasmine specs for `Pagination`, `PaginationHelper`, `PaginationController`, `PaginationBuilder` exist and pass

No code changes needed — verify existing implementation is complete and specs pass.

## Files

| File | Status |
|------|--------|
| `frontend/assets/js/client/GenericClient.js` | Already reads pagination headers |
| `frontend/assets/js/utils/HashRouteResolver.js` | Already forwards page/per_page params |
| `frontend/assets/js/components/pages/controllers/GameNpcsController.js` | Already calls fetchIndex |
| `frontend/assets/js/components/pages/GameNpcs.jsx` | Already wired |
| `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` | Already renders Pagination |
| `frontend/assets/js/components/elements/Pagination.jsx` | Already exists |
| `frontend/assets/js/components/elements/helpers/PaginationHelper.jsx` | Already exists |
| `frontend/assets/js/components/elements/controllers/PaginationController.js` | Already exists |
| `frontend/specs/assets/js/components/elements/PaginationSpec.js` | Already exists |
