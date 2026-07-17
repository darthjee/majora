# Plan: Header Overhauling

Issue: [634-header-overhauling.md](../../issues/634-header-overhauling.md)

## Overview
Reorganize the app header's navigation by clustering related links into three new `NavDropdown` menus — "Admin" (Treasures + Staff Users), "PC" (Overview + Photos + Treasures on any PC sub-route), and "NPC" (mirrored for NPC sub-routes) — reusing the existing "Game" dropdown pattern, and remove the now-redundant standalone Treasures button from the game show page. No permission logic changes. The frontend agent implements the header/route/component changes; the translator agent adds the small set of new i18n keys the frontend code will reference.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

New i18n keys the frontend code calls via `Translator.t(...)`, to be added by the translator agent to both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` under the existing `header:` block:

- `header.nav_admin` — title of the new Admin dropdown. EN: `Admin`. PT: `Admin`.
- `header.nav_pc` — title of the new PC dropdown. EN: `PC`. PT: `PC`.
- `header.nav_npc` — title of the new NPC dropdown. EN: `NPC`. PT: `NPC`.

No other new keys are needed:
- The PC/NPC dropdown's "Overview" item (link back to the character's own page) reuses the existing `header.nav_game_show` key (EN `Show` / PT `Ver`), which is already generic wording, not game-specific.
- The PC/NPC dropdown's "Treasures" item reuses the existing `character_page.treasures_title` key (`Treasures`).
- The PC/NPC dropdown's "Photos" item reuses the existing `character_page.see_all_photos` key (`Photos`), same as the link it replaces.
- The game show page's Treasures button being removed used `game_page.treasures`, which stays in use elsewhere (still shown in the "Game" dropdown) and must **not** be deleted.
