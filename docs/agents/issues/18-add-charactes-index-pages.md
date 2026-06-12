# Issue: Improve Characters Index Pages (PCs and NPCs)

## Description

The PCs (`/#/games/:slug/pcs`) and NPCs (`/#/games/:slug/npcs`) index pages currently render
plain text stubs. They need to be improved with Bootstrap card layouts, character avatars,
links to character detail pages, and pagination — mirroring the Games index page. The
Character detail page also needs to be improved. When a character has no avatar, the default
avatar image (`frontend/assets/images/default_character.png`) should be used as fallback.

## Problem

- `GamePcs` renders `<div>Game PCs ({pcs.length}) - page {pagination.page}</div>` — no layout.
- `GameNpcs` renders `<div>Game NPCs ({npcs.length}) - page {pagination.page}</div>` — no layout.
- `Character` renders only the character name with no detail.
- No avatar fallback — if `avatar_url` is null, nothing is shown.
- No pagination UI on PCs/NPCs pages.

## Expected Behavior

- PCs and NPCs index pages display Bootstrap cards with character avatar and name.
- Each card links to the character detail page (`#/games/:slug/characters/:id`).
- When `avatar_url` is null or empty, `default_character.png` is shown as fallback.
- Both index pages include the `Pagination` component.
- The Character detail page is improved to show avatar, name, class, level, description,
  and photos gallery.
- All pages follow the three-layer architecture (component → controller → helper).
- Repetitive or complex HTML is extracted into reusable elements.

## Solution

### Shared element
- `CardAvatar` — generic card image component for characters, analogous to `CardPhoto`.
  Uses `default_character.png` when `url` is falsy (same pattern as `CardPhoto`).
- `CharacterCard` — Bootstrap card for a character (avatar + name + link), analogous to `GameCard`.
  Delegates to `CharacterCardHelper`.

### PCs and NPCs index pages
- Create `GameCharactersHelper.jsx` (shared helper for both PCs and NPCs listing).
  Or create separate `GamePcsHelper.jsx` and `GameNpcsHelper.jsx` — choose based on how
  similar the two layouts are (likely identical, so a shared helper makes sense).
- Refactor `GamePcs.jsx` and `GameNpcs.jsx` to delegate to their respective helpers.

### Character detail page
- Create `CharacterHelper.jsx` with `render(character)`, `renderLoading()`, `renderError(error)`.
- Update `Character.jsx` to delegate to `CharacterHelper`.
- Show: avatar (full size), name, class, level, description, photos.

## Benefits

- Consistent visual style across all index pages.
- Reuses `CardAvatar` and `CharacterCard` components wherever character avatars are shown.
- Makes use of the already-committed `default_character.png` asset.

---
See issue for details: https://github.com/darthjee/majora/issues/18
