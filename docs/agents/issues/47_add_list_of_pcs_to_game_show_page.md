# Add list of PCs to game show page

## Context

The game show page (`/#/games/:game_slug`) currently has a button linking out to the PCs index page, which gives no preview of the actual characters. An embedded preview improves discoverability without forcing navigation away from the page.

## What needs to be done

- Frontend:
  - Remove the "Player Characters" button from `GameNavLinks`.
  - Add a PCs preview section at the bottom of the game show page:
    - No pagination.
    - Only the first N PCs are shown, where N is a constant (6).
    - Cards are small.
    - The character's name is used as the image's alt text (already the case for `CardAvatar`).
    - A "See all PCs" link pointing to `/#/games/:game_slug/pcs`.
  - Each character card still links to its own character page (already true via the existing `characterType` prop).
  - Reuse existing character-card rendering logic, parameterized for: no pagination, max-count limit, and small card size.

## Acceptance criteria

- [ ] The "Player Characters" button is removed from the game show page
- [ ] The game show page shows up to 6 PCs in a small-card preview section, with no pagination controls
- [ ] The preview section includes a "See all PCs" link to `/#/games/:game_slug/pcs`
- [ ] Each preview card links to its character's detail page
- [ ] Existing/added Jasmine specs cover the new section and pass
