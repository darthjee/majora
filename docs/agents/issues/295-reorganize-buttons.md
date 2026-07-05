# Reorganize buttons

## Context

Some navigation links on game and character detail pages are currently rendered as button-styled links (`btn btn-outline-secondary`) at the bottom of the page content. These are page-specific navigation actions but live outside the global header, unlike other top-level nav links (Games, Treasures, Staff Users). This issue moves them into the global site header (`Header.jsx`/`HeaderHelper.jsx`) as plain nav links, shown only while viewing the relevant page.

- On `/#/games/:game_slug` (`GameHelper.jsx`), the "Treasures", "Sessions", and "See all photos" buttons are rendered as `btn btn-outline-secondary` links below the game description/character previews.
- On `/#/games/:game_slug/pc/:id` and `/#/games/:game_slug/npc/:id` (`CharacterHelper.jsx`), the "See all photos" button is rendered the same way below the character details.

## What needs to be done

- Add a way for the header to know the current route and its params (e.g. resolving the current hash via `HashRouteResolver`, or an equivalent lightweight parse) so it can conditionally render the Treasures/Sessions/Photos links with the correct `game_slug`/character id, and re-evaluate on hash change.
- Extend `HeaderHelper.jsx` with new private renderers for these contextual links, following the existing pattern used for `#renderTreasuresNavLink`/`#renderStaffUsersNavLink`.
- Remove the now-redundant button blocks from `GameHelper.jsx` and `CharacterHelper.jsx`.
- Rename the `game_page.see_all_photos` and `character_page.see_all_photos` translation keys/values to "Photos" (or add new keys and drop the old ones, keeping en/pt in sync).

## Acceptance criteria

- [ ] While viewing `/#/games/:game_slug` (the `game` route), the global header shows three plain nav links: "Treasures", "Sessions", "Photos", linking to `#/games/:game_slug/treasures`, `#/games/:game_slug/sessions`, and `#/games/:game_slug/photos` respectively. The buttons at the bottom of `GameHelper.jsx` are removed.
- [ ] While viewing a PC or NPC character detail page (`/#/games/:game_slug/pcs/:id` or `/#/games/:game_slug/npcs/:id`), the global header shows a single plain nav link "Photos", linking to `#/games/:game_slug/pcs/:id/photos` or `#/games/:game_slug/npcs/:id/photos` respectively. The button at the bottom of `CharacterHelper.jsx` is removed. Treasures/Sessions links are NOT shown on these pages.
- [ ] These links only appear while on those exact routes; they are not shown on any other page (including the Treasures/Sessions/Photos pages themselves, the games list, home, etc.).
- [ ] Link labels use plain nav-link styling (matching the header's existing style), not button styling.
- [ ] The "See all photos" label is shortened to "Photos" in both `game_page` and `character_page` translation namespaces, to match the new header link text.

---
Tags: :shipit:
