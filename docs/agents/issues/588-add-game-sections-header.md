# Issue: Add game sections header

## Description
Add a "Game" navigation dropdown to the header, so that any page within a game (`/#/games/:game_slug/...`) exposes quick links to the game's key sections instead of requiring manual URL edits.

## Problem
The header currently only shows a contextual game nav (Treasures, Sessions, Photos) as individual flat links, and only while on the game show page itself (`HeaderHelper#renderGameNavLinks`, gated on `route.page === 'game'` in `HeaderController`) — it disappears on every other game sub-page (pcs, npcs, treasures, polls, sessions, character pages, edit/new forms, tasks, etc). There is no link to PCs, NPCs, or Polls at all, and the existing Sessions link is shown unconditionally even though session content is restricted to the game's DM(s), players, and admins. Simply adding more individual links to the main nav row would make it too crowded alongside the existing Games/Treasures/Staff/auth/language/status items.

## Expected Behavior
- A single "Game" dropdown (react-bootstrap `NavDropdown`) appears in the main header nav row on every page nested under `/games/:game_slug/...` — not just the 6 section pages, but also character show/edit pages, poll/session detail and new forms, treasure edit, tasks, photos, etc. Effectively: whenever the current route resolves a `gameSlug`, the dropdown shows.
- The dropdown menu lists: Show (the game page itself), PCs, NPCs, Treasures, Polls, Sessions, Photos.
- Show, PCs, NPCs, Treasures, and Photos menu items are visible to everyone, including anonymous/guest visitors.
- Polls and Sessions menu items are visible only to the game's DM(s), players, and admins (superuser/staff) — the same audience rule already used for other DM/player-only game surfaces (e.g. `OpenPollsWidget`, `GamePollsController`).

## Solution
- No new sub-header component: extend the existing single Navbar-based header (`react-bootstrap`, already used in `HeaderHelper.jsx`), adding one `NavDropdown` ("Game") instead of one `Nav.Link` per section — keeps the main row to a single new item regardless of how many game sections exist.
- Extend `HeaderController.ROUTE_PATTERNS`/`getRoute()` so `gameSlug` resolves on every `/games/:game_slug/...` route, not only `game`/`pcCharacter`/`npcCharacter`.
- Replace `HeaderHelper#renderGameNavLinks`'s flat `Nav.Link`s with a `NavDropdown` that triggers on any route with a resolved `gameSlug` (not only `route.page === 'game'`), always rendering Show/PCs/NPCs/Treasures/Photos items, and gating Polls/Sessions behind `is_dm || is_player || is_superuser || is_staff`, sourced from `AccessStore.ensureGameAccess`/`getGameAccess` — the exact same check and data source already used by `OpenPollsWidget`/`GamePollsController`.

## Benefits
Consistent in-game navigation from any page without crowding the main header row, discoverability of the Polls list without needing to know the URL, and menu visibility that matches the DM/player/admin-only access already enforced on the Sessions and Polls pages themselves.
