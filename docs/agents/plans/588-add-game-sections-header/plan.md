# Plan: Add game sections header

Issue: [588-add-game-sections-header.md](../issues/588-add-game-sections-header.md)

## Overview
Replace the header's flat, game-page-only nav links (`HeaderHelper#renderGameNavLinks`) with a single "Game" `NavDropdown` that appears on every route nested under `/games/:game_slug/...`, listing Show/PCs/NPCs/Treasures/Photos (everyone) and Polls/Sessions (DM/player/admin only). This is a purely frontend, single-agent change — no backend or translation-file-maintenance work beyond the incidental new i18n keys the frontend agent adds alongside the component, matching how existing `game_page.*` keys were added in prior feature work.

## Context
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx#renderGameNavLinks` currently renders flat `Nav.Link`s for Treasures/Sessions/Photos, gated only on `state.route?.page === 'game'` — i.e. only on the game show page itself, and unconditionally (no role check) whenever it does show.
- `frontend/assets/js/components/common/controllers/HeaderController.js` computes `route` via `getRoute()`, which looks up a hardcoded `ROUTE_PATTERNS` map (`game`, `pcCharacter`, `npcCharacter` only) to know which pattern to pass to `HashRouteResolver#getParams`. Every other game-prefixed page (`gamePcs`, `gameNpcs`, `gameTreasures`, `gamePolls`, `gamePoll`, `gamePollNew`, `gameSessions`, `gameSession`, `gameSessionEdit`, `gameSessionNew`, `gameTasks`, `gamePhotos`, `gameEdit`, `pcCharacterEdit`/`Photos`/`Treasures`, `npcCharacterEdit`/`Photos`/`Treasures`, `gameTreasureNew`/`Edit`) is missing from this map, so `gameSlug` doesn't resolve there today.
- All game-scoped routes in `frontend/assets/js/utils/routing/HashRouteResolver.js` share the `/games/:game_slug/...` prefix, with exactly two exceptions that must NOT resolve a slug: `/games` (list) and `/games/new` (creation form). `Route#params` does a **full-string** regex match (`^pattern/?$`), so reusing the existing `getParams('/games/:game_slug', hash)` call against a deeper hash (e.g. `/games/epic-quest/polls`) will NOT match — a per-page `ROUTE_PATTERNS` lookup cannot simply be pointed at the shallow pattern.
- Role/audience gating precedent already exists for the identical dm/player/admin audience, via `AccessStore.ensureGameAccess(gameSlug)` / `AccessStore.getGameAccess(gameSlug)`, and the exact boolean check `Boolean(access.is_dm || access.is_player || access.is_superuser || access.is_staff)` — see `OpenPollsWidget.jsx` and `GamePollsController.js`/`GamePollController.js`/`GamePollNewController.js`. `AccessStoreAccess`'s default (`ACCESS_DEFAULT`) fails closed (all flags falsy/null), so an unresolved/loading fetch correctly hides Polls/Sessions until the real access payload arrives.
- No `NavDropdown` is used anywhere in the codebase yet; `HeaderHelper.jsx` already imports sibling react-bootstrap components via `react-bootstrap/cjs/<Name>.js` (e.g. `Navbar.js`, `Nav.js`, `Container.js`) — follow that same import style for `NavDropdown.js`.
- Existing translation keys already cover several of the needed labels: `game_page.treasures`, `game_page.sessions`, `game_page.see_all_photos`, `game_page.player_characters` (PCs), `game_page.non_player_characters` (NPCs). New keys are needed for: the dropdown's own label (e.g. `header.nav_game`), and a "Show"/game-page link label (there's no existing generic one — `header.nav_games` is the plural games-list link, not the singular show link). Add new keys to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` (checked by `npm run check_i18n`).
- Relevant specs: `frontend/specs/assets/js/components/common/controllers/HeaderController/getRouteSpec.js` and `frontend/specs/assets/js/components/common/helpers/HeaderHelper/gameNavLinksSpec.js` (uses a `render(state)` test helper in `.../HeaderHelper/support.js` that passes state directly, bypassing the controller).

## Implementation Steps

### Step 1 — Resolve `gameSlug` on every game-scoped route
In `HeaderController.js`, replace the `ROUTE_PATTERNS`-lookup approach (for the game-prefix case) with a direct regex match against the current hash, independent of which specific game sub-page matched — e.g. match `/^\/games\/([^/]+)/` against the raw path and treat `new` as not a real slug (since `/games/new` is the creation form, not a game). This avoids hand-maintaining a ~20-entry pattern map that must stay in sync with every route `HashRouteResolver` registers, and automatically covers any future game sub-route. Keep the existing `pcCharacter`/`npcCharacter` handling (for `characterId`) as-is, or fold it into the same general parsing — whichever keeps `getRoute()`'s return shape (`{ page, gameSlug, characterId }`) unchanged for existing consumers (`#renderCharacterPhotosNavLink` still needs `page` to distinguish `pcCharacter`/`npcCharacter`).
- Update `getRouteSpec.js` to cover the newly-resolving pages (e.g. `gamePolls`, `gameSessions`, `gameTasks`, a poll/session detail page) asserting `gameSlug` is now populated, plus the two negative cases (`games`, `gameNew`) asserting it is NOT populated.

### Step 2 — Fetch game access/role for the header
`Header.jsx` needs the current game's `is_dm`/`is_player`/`is_superuser`/`is_staff` flags whenever `route.gameSlug` is set, to gate Polls/Sessions. Add an effect (mirroring the existing `route`-driven effect) that calls `AccessStore.ensureGameAccess(gameSlug)` when `route.gameSlug` changes, storing the result in new `Header` state (e.g. `gameAccess`), defaulting to `AccessStoreAccess`'s fail-closed default when unresolved/absent. Pass this new state through to `HeaderHelper.render`.

### Step 3 — Replace the flat game nav links with a "Game" `NavDropdown`
In `HeaderHelper.jsx`, replace `#renderGameNavLinks`'s flat `Nav.Link`s with a `NavDropdown` (import from `react-bootstrap/cjs/NavDropdown.js`, same style as the other react-bootstrap imports), triggered whenever `state.route?.gameSlug` is present (not `state.route?.page === 'game'`):
- Dropdown title: new `header.nav_game` translation key.
- Always-visible items: Show (`#/games/:gameSlug`, new label), PCs (`#/games/:gameSlug/pcs`, reuse `game_page.player_characters`), NPCs (`#/games/:gameSlug/npcs`, reuse `game_page.non_player_characters`), Treasures (`#/games/:gameSlug/treasures`, reuse `game_page.treasures`), Photos (`#/games/:gameSlug/photos`, reuse `game_page.see_all_photos`).
- Gated items (only when `Boolean(state.gameAccess?.is_dm || state.gameAccess?.is_player || state.gameAccess?.is_superuser || state.gameAccess?.is_staff)`): Polls (`#/games/:gameSlug/polls`, reuse `game_page.polls_title` or add a nav-specific key if that one reads awkwardly as a link label), Sessions (`#/games/:gameSlug/sessions`, reuse `game_page.sessions`).
- Use `NavDropdown.Item` with `href` (matching the existing `Nav.Link href="#/..."` pattern elsewhere in this file) rather than an `onClick` navigation, so the hash-based routing keeps working unchanged.

### Step 4 — Add the new translation keys
Add `header.nav_game` (dropdown label) and a game-show link label (e.g. `game_page.show` or `header.nav_game_show`) to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`. Run `npm run check_i18n` to confirm both files stay in sync.

### Step 5 — Update/add specs
- `gameNavLinksSpec.js`: rewrite to assert the new `NavDropdown` renders Show/PCs/NPCs/Treasures/Photos whenever `route.gameSlug` is set (regardless of `route.page`), Polls/Sessions only render when `gameAccess` grants dm/player/superuser/staff, and nothing renders when `route`/`gameSlug` is absent (covering both the "route undefined" and "no gameSlug" cases already tested today, plus a case for a non-`is_dm`/`is_player`/superuser/staff `gameAccess`).
- `getRouteSpec.js`: per Step 1.
- Add/extend a spec for `Header.jsx`'s new `gameAccess`-fetching effect if `Header.jsx`'s existing spec suite covers its other effects (route, auth) the same way — follow that file's existing pattern rather than introducing a new one.

## Files to Change
- `frontend/assets/js/components/common/controllers/HeaderController.js` — resolve `gameSlug` for every game-scoped route, not just `game`/`pcCharacter`/`npcCharacter`.
- `frontend/assets/js/components/common/Header.jsx` — fetch and pass through `gameAccess` (via `AccessStore.ensureGameAccess`) whenever `route.gameSlug` is set.
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — replace `#renderGameNavLinks`'s flat links with a `NavDropdown`, add the Polls/Sessions gating.
- `frontend/assets/i18n/en.yaml`, `frontend/assets/i18n/pt.yaml` — add `header.nav_game` and a game-show link label key.
- `frontend/specs/assets/js/components/common/controllers/HeaderController/getRouteSpec.js` — cover newly-resolving game routes.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/gameNavLinksSpec.js` — rewrite for the dropdown + gating behavior.
- `frontend/specs/assets/js/components/common/Header*` (whichever spec file(s) cover `Header.jsx`'s effects today) — cover the new `gameAccess` effect.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes
- `AccessStore.ensureGameAccess` is already cache-backed (`AccessCache`), so calling it again from the header for a game page the user is already on (which itself calls the same `ensureGame`/`ensureGameAccess`) should not cause a duplicate network round-trip in the common case — confirm this during implementation by checking `AccessCache`'s key/dedup behavior.
- Confirm whether `#renderCharacterPhotosNavLink` (the separate PC/NPC-character "Photos" link) should also move inside the new dropdown or stay as its own standalone link — the issue only asked about the game-level sections, not the character-level Photos link, so leaving it untouched is the conservative default unless it reads oddly next to the new dropdown.
- Confirm the exact wording for the two new translation keys (`header.nav_game` dropdown label, and the game-show link label) with whatever house style the rest of `header.*`/`game_page.*` keys use (title case vs sentence case, etc.) — not specified by the issue.
