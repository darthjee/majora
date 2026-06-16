# Frontend Plan: Remove players link

Main plan: [plan.md](plan.md)

## Tasks

1. In `frontend/assets/js/components/elements/helpers/GameNavLinksHelper.jsx`:
   - Remove the `<a href={...players...}>Players</a>` anchor element
   - Update the JSDoc comment (remove mention of "players pages")
2. In `frontend/specs/assets/js/components/elements/helpers/GameNavLinksHelperSpec.js`:
   - Remove the `it('renders a link to the players page', ...)` test
   - Remove the `players` assertion from `it('uses the provided slug in all links', ...)`
3. Run the full frontend dev cycle (lint + specs) and confirm all tests pass

## Files

| File | Change |
|------|--------|
| `frontend/assets/js/components/elements/helpers/GameNavLinksHelper.jsx` | Remove players link and update JSDoc |
| `frontend/specs/assets/js/components/elements/helpers/GameNavLinksHelperSpec.js` | Remove players-related test assertions |
