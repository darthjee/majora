# Add list of NPCs to game show page

## Context

The game show page (`/#/games/:game_slug`) currently has a button linking out to the NPCs index page, which gives no preview of the actual characters. This mirrors the PCs preview section added in #47, using the same reusable `CharacterPreviewSection` component.

## What needs to be done

- Frontend:
  - Remove the "Non-Player Characters" button from `GameNavLinks`.
  - Add an NPCs preview section below the PCs section (added by #47), at the bottom of the game show page:
    - No pagination.
    - Only the first 6 NPCs are shown (reusing the existing `MAX_PREVIEW_CHARACTERS` constant).
    - Cards are small.
    - The character's name is used as the image's alt text (already the case for `CardAvatar`).
    - A "See all NPCs" link pointing to `/#/games/:game_slug/npcs`.
  - Each character card still links to its own character page (already true via the existing `characterType` prop).
  - Reuse the `CharacterPreviewSection` component introduced in #47.

## Acceptance criteria

- [ ] The "Non-Player Characters" button is removed from the game show page
- [ ] The game show page shows up to 6 NPCs in a small-card preview section, below the PCs section, with no pagination controls
- [ ] The preview section includes a "See all NPCs" link to `/#/games/:game_slug/npcs`
- [ ] Each preview card links to its character's detail page
- [ ] Existing/added Jasmine specs cover the new section and pass
