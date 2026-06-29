# Issue: Add game treasures page

## Description
Add a game treasures list page at `/#/games/:game_slug/treasures` showing the treasures associated with a specific game. Add a link to this page from the game show page. Treasures have a many-to-many relationship with games (a treasure can appear in multiple games). Managing the association is out of scope — this issue covers the read-only list page only.

## Expected Behavior
- The game show page gets a new section or link pointing to `#/games/:game_slug/treasures`
- The treasures list page shows all treasures connected to that game (name and value)
- The page is accessible to all authenticated users
- Follows the same pattern as the PCs/NPCs sections on the game show page

## Solution
- Backend: M2M relationship between `Game` and `Treasure` (join model or `ManyToManyField`); `GET /games/:game_slug/treasures.json` endpoint returning the associated treasures
- Frontend: new `GameTreasures` page component, controller, and helper; link/section added to `GameHelper`; new route `/games/:game_slug/treasures` in `HashRouteResolver.js` and `AppHelper.jsx`; i18n keys for the new page

---

Tags: ✏️
