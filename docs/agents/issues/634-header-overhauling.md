# Issue: Header Overhauling

## Description
The header currently exposes several standalone links that should instead be clustered into dropdown menus, following the same `NavDropdown` pattern already used for the existing "Game" menu. This is a navigation reorganization only — no permission or access-control changes are involved.

## Problem
- The header shows standalone links for `/#/treasures` and `/#/staff/users` (visible to superusers/staff) instead of grouping them under a single "Admin" menu.
- On PC pages (`/#/games/:game_slug/pcs/:id` and its sub-routes), the header shows a standalone "Photos" link instead of grouping character-related links under a "PC" menu, and has no link to that PC's Treasures page.
- On NPC pages (`/#/games/:game_slug/npcs/:id` and its sub-routes), the header shows a standalone "Photos" link instead of grouping character-related links under an "NPC" menu, and has no link to that NPC's Treasures page.
- On the game show page (`/#/games/:game_slug`), a "Treasures" button is redundant with the link already available in the "Game" dropdown menu.

## Solution
Reuse the existing `NavDropdown`/`NavDropdown.Item` pattern (see `#renderGameNavLinks` in `frontend/assets/js/components/common/helpers/HeaderHelper.jsx`) to add three new dropdown groups, without changing any existing permission checks:

1. **Admin dropdown** — group the current `/#/treasures` and `/#/staff/users` links (still gated on `state.isSuperUser || state.isStaff`) into a new "Admin" `NavDropdown`.
2. **PC dropdown** — shown while on `/#/games/:game_slug/pcs/:id` or any of its sub-routes. Contains:
   - an Overview link back to the character's main page (`/#/games/:game_slug/pcs/:id`)
   - the existing Photos link (`/#/games/:game_slug/pcs/:id/photos`), moved out of its standalone spot
   - a new Treasures link (`/#/games/:game_slug/pcs/:id/treasures`) — the route and page already exist (`PcCharacterTreasures.jsx`), this only adds the header entry
3. **NPC dropdown** — same as PC, mirrored for `/#/games/:game_slug/npcs/:id` and sub-routes: Overview, Photos, and the existing `NpcCharacterTreasures.jsx` route.
4. **Game show page cleanup** — remove the standalone "Treasures" button from `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx`, since it's already reachable from the "Game" dropdown.

`HeaderRouteResolver.js` currently only resolves `characterId` for the exact `pcCharacter`/`npcCharacter` pages (not their sub-route pages like `pcCharacterPhotos`/`pcCharacterTreasures`/`pcCharacterEdit`/etc.). It needs to be extended so `characterId` resolves on **every** pc/npc-character sub-route, so the new dropdowns consistently appear everywhere under a character's pages, not just on the main page/photos/treasures.

Existing specs under `frontend/specs/assets/js/components/common/helpers/HeaderHelper/` and `HeaderRouteResolverSpec.js` will need corresponding updates.
