# Plan: Fix photos in pcs and npcs list in game page

Issue: [582-fix-photos-in-pcs-and-npcs-list-in-game-page.md](../../issues/582-fix-photos-in-pcs-and-npcs-list-in-game-page.md)

## Overview

The game page's PC/NPC preview sections (`CharacterPreviewSectionHelper`) currently render
each character using the shared `CharacterCard` component with `size="small"`, which uses
narrower grid columns than the trailing `SeeAllCard` and still carries the info bar/action
bar overlay meant for character management. This plan introduces a new, dedicated
`CharacterPreviewCard` component styled like `SeeAllCard` (same columns, photo instead of
icon, grayscale-for-slain, NPC-only allegiance border, whole card links to the character),
and swaps it in for `CharacterCard` inside `CharacterPreviewSectionHelper`. `CharacterCard`
and `SeeAllCard` themselves stay unchanged since they're still used elsewhere (standalone
PC/NPC list pages; `SeeAllCard` is also used for Treasures/Photos previews).

## Context

- `frontend/assets/js/components/resources/game/pages/helpers/GameHelper.jsx:73-88` renders
  two `CharacterPreviewSection` instances (one for `pc`, one for `npc`).
- `frontend/assets/js/components/common/CharacterPreviewSection.jsx` and its helper
  `frontend/assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx` render a
  heading, a row of `CharacterCard` elements (`size="small"`), and a trailing `SeeAllCard`.
- `frontend/assets/js/components/common/helpers/CharacterCardHelper.jsx:69` uses
  `col-sm-3 col-md-2 col-lg-1` for `size="small"` vs `SeeAllCard`'s
  `col-6 col-sm-4 col-md-3 col-lg-2` (`frontend/assets/js/components/common/helpers/SeeAllCardHelper.jsx:17`)
  — the column mismatch is why photos look smaller than the see-more card.
- For NPCs, `CharacterCardHelper.#renderPhoto` wraps the photo in `ActionsOverlay`
  (upload button + secondary slain/revive buttons + `InfoBar`); for PCs it renders
  `CardAvatar` directly next to an `InfoBar`. Both are irrelevant on this read-only preview.
- Grayscale-for-slain: `ActionsOverlay` adds `photo-grayscale` when `grayscale` is true
  (`frontend/assets/js/components/common/ActionsOverlay.jsx:42`); CSS in
  `frontend/assets/css/main.scss:107-109` (`filter: grayscale(100%)` on `.card-photo-square img`).
  The new component needs to apply the same class/behavior directly (without `ActionsOverlay`).
- Allegiance border: `frontend/assets/js/utils/ui/AllegianceBorder.js` (`allegianceBorderClass`),
  applied only for `characterType === 'npc'` today (`CharacterCardHelper.jsx:71-73`) — keep
  this NPC-only behavior unchanged.
- Photo/placeholder: `frontend/assets/js/components/common/CardAvatar.jsx` renders the photo
  (or `assets/images/placeholders/default_character.png` fallback) inside a
  `card-photo-square` div — reuse this component directly.
- No new translation strings are needed; the existing `character_preview_section.see_all`
  key stays as-is for `SeeAllCard`'s text.

## Implementation Steps

### Step 1 — Add `CharacterPreviewCard` component + helper

Create `frontend/assets/js/components/common/CharacterPreviewCard.jsx` (thin component,
mirroring the `CharacterCard.jsx` / `SeeAllCard.jsx` pattern) and
`frontend/assets/js/components/common/helpers/CharacterPreviewCardHelper.jsx` (static
render class), following the three-layer convention (component delegates to helper; no
controller needed since there's no state/effects here — same as `SeeAllCard`).

Render output, per character:
- Column wrapper matching `SeeAllCard`: `col-6 col-sm-4 col-md-3 col-lg-2 mb-4`.
- `card h-100` with border classes: `allegianceBorderClass(character.allegiance)` when
  `characterType === 'npc'`, plain `card h-100` otherwise (same condition as
  `CharacterCardHelper.jsx:71-73`).
- Photo via `CardAvatar` (`url={character.profile_photo_path}`, `alt={character.name}`),
  wrapped in a div with a `photo-grayscale` class when `character.slain` is true (reusing the
  existing `.photo-grayscale .card-photo-square img` CSS rule — no new CSS needed).
- No `InfoBar`, no `ActionsOverlay`/`ActionBar` — just the photo.
- No card body/name (matches today's `size="small"` `CharacterCard`, which also renders no
  name, and `SeeAllCard`, which has no visible text either).
- Whole card wrapped in an `<a href="#/games/{gameSlug}/{characterType}s/{character.id}">`
  (same href pattern as `CharacterCardHelper.render`, `CharacterCardHelper.jsx:78`).

### Step 2 — Swap `CharacterPreviewSectionHelper` to use the new component

In `frontend/assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx`, replace
the `CharacterCard` import/usage (lines 2, 31-38) with `CharacterPreviewCard`, passing
`character`, `gameSlug`, and `characterType` (no `size` prop needed — the new component has
one layout). Leave the `SeeAllCard` usage and everything else in this helper unchanged.

### Step 3 — Tests

- Add `frontend/specs/assets/js/components/common/CharacterPreviewCardSpec.js` and
  `frontend/specs/assets/js/components/common/helpers/CharacterPreviewCardHelperSpec.js`,
  following the existing patterns in `SeeAllCardSpec.js` / `SeeAllCardHelperSpec.js` and
  `CharacterCardHelperSpec.js`. Cover: photo rendering with/without `profile_photo_path`
  (placeholder fallback), grayscale class applied when `slain` is true, allegiance border
  class applied for NPCs only (ally/enemy/neutral/missing), link href for both `pc` and `npc`
  character types, and absence of `InfoBar`/`ActionBar`/upload button.
- Update `frontend/specs/assets/js/components/common/helpers/CharacterPreviewSectionHelperSpec.js`
  to assert it now renders `CharacterPreviewCard` (not `CharacterCard`) for each character.

## Files to Change

- `frontend/assets/js/components/common/CharacterPreviewCard.jsx` — new component (create).
- `frontend/assets/js/components/common/helpers/CharacterPreviewCardHelper.jsx` — new render
  helper (create).
- `frontend/assets/js/components/common/helpers/CharacterPreviewSectionHelper.jsx` — swap
  `CharacterCard` usage for `CharacterPreviewCard`.
- `frontend/specs/assets/js/components/common/CharacterPreviewCardSpec.js` — new spec (create).
- `frontend/specs/assets/js/components/common/helpers/CharacterPreviewCardHelperSpec.js` — new
  spec (create).
- `frontend/specs/assets/js/components/common/helpers/CharacterPreviewSectionHelperSpec.js` —
  update expectations to the new component.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `CharacterCard`, `CharacterCardHelper`, and `SeeAllCard`/`SeeAllCardHelper` are left
  untouched — they're still used by the standalone PC/NPC list pages and by other
  `SeeAllCard` callers (e.g. Treasures/Photos previews) respectively.
- No new translation keys are introduced, so `npm run check_i18n` is unaffected.
- No backend, product, or access-control changes — this is a purely presentational,
  frontend-only change with no new entities, endpoints, or data exposure.
