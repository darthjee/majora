# Frontend Plan: Add pagination to other index pages

Main plan: [plan.md](plan.md)

## Shared contracts

Both endpoints return the same pagination headers as the NPCs endpoint:
- `page`, `pages`, `per_page`, `total`

Links use hash-based routing:
- `#/games?page=N&per_page=M` for the games list
- `#/games/:game_slug/pcs?page=N&per_page=M` for the PCs list

## Tasks

The full pagination infrastructure is already implemented for both pages. Verify and confirm:

1. `GamesController.buildEffect()` calls `client.fetchIndex('/games.json')` and passes `pagination` to `setPagination` — ✓ already done
2. `Games.jsx` passes `pagination` to `GamesHelper.render(games, pagination)` — ✓ already done
3. `GamesHelper.render` renders `<Pagination basePath="#/games" .../>` — ✓ already done
4. `GamePcsController.buildEffect()` calls `client.fetchIndex('/games/:slug/pcs.json')` via `fetchIndex` — ✓ already done
5. `GamePcs.jsx` passes `pagination` to `GameCharactersHelper.render(pcs, pagination, basePath, ...)` — ✓ already done
6. `GameCharactersHelper.render` renders `<Pagination basePath="#/games/:slug/pcs" .../>` — ✓ already done
7. All Jasmine specs for `GamesController`, `GamesHelper`, `GamePcsController`, `GameCharactersHelper` exist and pass

Run the full spec suite and confirm 0 failures.

## Files

| File | Status |
|------|--------|
| `frontend/assets/js/components/pages/Games.jsx` | Already wired |
| `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` | Already renders Pagination |
| `frontend/assets/js/components/pages/controllers/GamesController.js` | Already calls fetchIndex |
| `frontend/assets/js/components/pages/GamePcs.jsx` | Already wired |
| `frontend/assets/js/components/pages/controllers/GamePcsController.js` | Already calls fetchIndex |
