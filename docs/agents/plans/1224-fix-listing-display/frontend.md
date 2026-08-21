# frontend Plan: Fix listing display: flexible column grid leaks to non-game list types

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add flexibleColumns config flag](frontend/01-add-flexible-columns-config-flag.md)
- [02 — Thread the flag through ListPageHelper](frontend/02-thread-flag-through-listpagehelper.md)
- [03 — Update specs](frontend/03-update-specs.md)

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- Purely presentational — no backend, permission, or endpoint changes.
- `treasures`/`sixTreasures`/`tenTreasures` cases in `ListPageHelperSpec.js` already pass 6+ items (>= their `itemsPerRow`), so `Math.min` was already a no-op there; the actual regression (few items on a non-flexible type) currently has no covering test — Step 3 adds one.
