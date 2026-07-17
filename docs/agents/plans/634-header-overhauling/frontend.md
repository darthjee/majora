# Frontend Plan: Header Overhauling

Main plan: [plan.md](plan.md)

## Shared contracts

This plan calls `Translator.t('header.nav_admin')`, `Translator.t('header.nav_pc')`, and `Translator.t('header.nav_npc')` for the three new dropdown titles — the translator agent adds these keys to `en.yaml`/`pt.yaml`. All other labels reuse existing keys already present (`header.nav_game_show`, `character_page.treasures_title`, `character_page.see_all_photos`) — see `plan.md`'s "Shared contracts" for the full mapping.

## Implementation Steps

### Step 1 — Extend `HeaderRouteResolver` to resolve `characterId` on every PC/NPC sub-route
File: `frontend/assets/js/components/common/controllers/HeaderRouteResolver.js`

`CHARACTER_ROUTE_PATTERNS` currently only has entries for the exact `pcCharacter`/`npcCharacter` pages, so `characterId` isn't resolved on `pcCharacterEdit`, `pcCharacterPhotos`, `pcCharacterTreasures` (and npc equivalents) — the page names/patterns already registered in `HashRouteResolver.js`. Add entries for all six additional pages:

```js
const CHARACTER_ROUTE_PATTERNS = {
  pcCharacter: '/games/:game_slug/pcs/:character_id',
  pcCharacterEdit: '/games/:game_slug/pcs/:character_id/edit',
  pcCharacterPhotos: '/games/:game_slug/pcs/:character_id/photos',
  pcCharacterTreasures: '/games/:game_slug/pcs/:character_id/treasures',
  npcCharacter: '/games/:game_slug/npcs/:character_id',
  npcCharacterEdit: '/games/:game_slug/npcs/:character_id/edit',
  npcCharacterPhotos: '/games/:game_slug/npcs/:character_id/photos',
  npcCharacterTreasures: '/games/:game_slug/npcs/:character_id/treasures',
};
```

No other logic in the class needs to change — `resolve()` already looks up `CHARACTER_ROUTE_PATTERNS[page]` generically.

### Step 2 — Replace the standalone Admin links with an "Admin" dropdown
File: `frontend/assets/js/components/common/helpers/HeaderHelper.jsx`

Replace `#renderTreasuresNavLink` and `#renderStaffUsersNavLink` (and their two call sites in `render()`, lines ~36-37) with a single `#renderAdminNavLinks(state)` method that keeps the exact same `state.isSuperUser || state.isStaff` gate but renders a `NavDropdown`:

```jsx
static #renderAdminNavLinks(state) {
  if (!state.isSuperUser && !state.isStaff) {
    return null;
  }

  return (
    <NavDropdown title={Translator.t('header.nav_admin')} id="header-admin-nav-dropdown" renderMenuOnMount>
      <NavDropdown.Item href="#/treasures">{Translator.t('header.nav_treasures')}</NavDropdown.Item>
      <NavDropdown.Item href="#/staff/users">{Translator.t('header.nav_staff_users')}</NavDropdown.Item>
    </NavDropdown>
  );
}
```

Update `render()` to call `{HeaderHelper.#renderAdminNavLinks(state)}` in place of the two removed calls.

### Step 3 — Replace the standalone character Photos link with "PC"/"NPC" dropdowns
File: `frontend/assets/js/components/common/helpers/HeaderHelper.jsx`

Replace `#renderCharacterPhotosNavLink` (and its call site, line ~39) with `#renderCharacterNavLinks(state)`, gated on the full set of pc/npc pages now resolvable after Step 1:

```jsx
static #renderCharacterNavLinks(state) {
  const page = state.route?.page;
  const isPc = page?.startsWith('pcCharacter');
  const isNpc = page?.startsWith('npcCharacter');

  if (!isPc && !isNpc) {
    return null;
  }

  const segment = isPc ? 'pcs' : 'npcs';
  const { gameSlug, characterId } = state.route;
  const base = `#/games/${gameSlug}/${segment}/${characterId}`;
  const title = Translator.t(isPc ? 'header.nav_pc' : 'header.nav_npc');
  const dropdownId = isPc ? 'header-pc-nav-dropdown' : 'header-npc-nav-dropdown';

  return (
    <NavDropdown title={title} id={dropdownId} renderMenuOnMount>
      <NavDropdown.Item href={base}>{Translator.t('header.nav_game_show')}</NavDropdown.Item>
      <NavDropdown.Item href={`${base}/photos`}>{Translator.t('character_page.see_all_photos')}</NavDropdown.Item>
      <NavDropdown.Item href={`${base}/treasures`}>{Translator.t('character_page.treasures_title')}</NavDropdown.Item>
    </NavDropdown>
  );
}
```

`page?.startsWith('pcCharacter')` relies on the naming convention already used by every pc/npc-character page (`pcCharacter`, `pcCharacterEdit`, `pcCharacterPhotos`, `pcCharacterTreasures`); it deliberately doesn't enumerate the page list a second time so any future sub-route page named `pcCharacter*` is picked up automatically as long as it's added to `CHARACTER_ROUTE_PATTERNS` in Step 1.

Update `render()` to call `{HeaderHelper.#renderCharacterNavLinks(state)}` in place of the removed call. Update the JSDoc `@returns` comment above the method to describe the dropdown instead of a link.

### Step 4 — Remove the redundant Treasures button from the game show page
File: `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx`

Delete the `<a href={`#/games/${game.game_slug}/treasures`} ...>` block (lines ~63-65) from `render()`. Leave `OpenPollsWidget` as the last element in that column. Do not touch the `game_page.treasures` translation key — it's still used by the "Game" dropdown in `HeaderHelper.jsx`.

### Step 5 — Update existing specs
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/navLinksSpec.js` — currently asserts plain `href="#/treasures"`/`href="#/staff/users"` `Nav.Link`s; update to assert the new "Admin" `NavDropdown` (title text + both item hrefs), following the assertion style already used in `gameNavLinksSpec.js` for the "Game" dropdown.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/characterPhotosNavLinkSpec.js` — rename/repurpose to cover the new PC/NPC dropdown: assert it renders on the base character page **and** on `pcCharacterEdit`/`pcCharacterPhotos`/`pcCharacterTreasures` (and npc equivalents) with the Overview/Photos/Treasures item hrefs, and still does not render on unrelated routes (`game`, `home`).
- `frontend/specs/assets/js/components/common/controllers/HeaderRouteResolverSpec.js` — add cases asserting `characterId` now resolves for the six newly-added sub-route pages, not just `pcCharacter`/`npcCharacter`.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/bottomButtonsSpec.js` — update/remove the assertion covering the removed Treasures button; confirm the sessions button assertion is untouched.

## Files to Change
- `frontend/assets/js/components/common/controllers/HeaderRouteResolver.js` — extend `CHARACTER_ROUTE_PATTERNS` to cover all pc/npc-character sub-routes.
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — replace standalone Admin links and character Photos link with the three new `NavDropdown` groups.
- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx` — remove the standalone Treasures button.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/navLinksSpec.js` — update for Admin dropdown.
- `frontend/specs/assets/js/components/common/helpers/HeaderHelper/characterPhotosNavLinkSpec.js` — update for PC/NPC dropdown across all sub-routes.
- `frontend/specs/assets/js/components/common/controllers/HeaderRouteResolverSpec.js` — add sub-route `characterId` resolution cases.
- `frontend/specs/assets/js/components/resources/game/pages/helpers/GameHelper/bottomButtonsSpec.js` — update for removed button.

## CI Checks
- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: not separately observed in `.circleci/config.yml` under a distinct job name, but is the project's standard lint entrypoint — run it before pushing regardless)

## Notes
- Keep the existing permission gating (`state.isSuperUser || state.isStaff`) unchanged for the Admin dropdown — the issue explicitly says permissions are out of scope.
- `renderMenuOnMount` is used by the existing "Game" dropdown for testability; carry it over to the three new dropdowns for consistency and so specs can assert on menu contents without simulating a click.
- Each `NavDropdown` needs a unique `id` prop (react-bootstrap requirement) — follow the `header-<name>-nav-dropdown` convention already used by `header-game-nav-dropdown`.
