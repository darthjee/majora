# Plan: Fix see more link

Issue: [653-fix-see-more-link.md](../issues/653-fix-see-more-link.md)

## Overview
`SeeAllCard`/`SeeAllCardHelper` currently renders a `card-body` section holding only an invisible `stretched-link` anchor (with the "See all {{title}}" text as its `aria-label`), which is not present on the regular preview cards (`CharacterPreviewCard`, `TreasurePreviewCard`). Those cards are photo-only and reveal their text via the shared `CardHoverTooltip` component on hover. This plan brings `SeeAllCard` in line: drop the `card-body`, and wrap the card with `CardHoverTooltip` so the "See all" text shows as a hover tooltip instead.

## Context
- `SeeAllCard.jsx` delegates to `SeeAllCardHelper.render(icon, text, href)`.
- `CharacterPreviewCardHelper.render` shows the established pattern: `<CardHoverTooltip content={...}><a href={...}><div className="card h-100">...</div></a></CardHoverTooltip>`, with the grid wrapper `<div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">` staying outside the tooltip wrapper.
- Only `frontend/` is touched — no backend, i18n key, or product changes are needed (the `character_preview_section.see_all` key is reused as-is).

## Implementation Steps

### Step 1 — Rework `SeeAllCardHelper.render`
In `frontend/assets/js/components/common/helpers/SeeAllCardHelper.jsx`:
- Import `CardHoverTooltip` from `../CardHoverTooltip.jsx`.
- Remove the `card-body` div and the `stretched-link` anchor/`aria-label`.
- Wrap `href` in an `<a>` (as the other preview cards do) around the `card h-100` div containing only the `card-photo-square` icon, and wrap that `<a>` in `<CardHoverTooltip content={text}>`, matching `CharacterPreviewCardHelper`'s structure (including `text-decoration-none text-dark` on the anchor for visual consistency).
- Keep the outer grid-cell wrapper (`col-6 col-sm-4 col-md-3 col-lg-2 mb-4`) and the `card-photo-square d-flex align-items-center justify-content-center bg-light` icon markup unchanged.
- Update the JSDoc comment on `render` to describe the new tooltip-based behavior instead of the stretched-link/aria-label one.

### Step 2 — Update `SeeAllCard.jsx` doc comment
In `frontend/assets/js/components/common/SeeAllCard.jsx`, update the component doc comment (currently says "stretch-linking the whole card") to reflect that hovering now shows `text` as a tooltip rather than only exposing it via `aria-label`/stretched-link.

### Step 3 — Update specs
- `frontend/specs/assets/js/components/common/helpers/SeeAllCardHelperSpec.js`: replace the `aria-label`/`stretched-link` assertions. Since `render()` returns the React element tree directly (not HTML), follow `CharacterPreviewCardHelperSpec.js`'s pattern (`rendered.props.children` → the `CardHoverTooltip` element → `tooltip.props.content`) to assert the `text` prop is fed to the tooltip's `content`, rather than trying to find it in `renderToStaticMarkup` output (`OverlayTrigger` only renders the overlay on hover/focus, so it won't appear in static markup). Keep the `renderToStaticMarkup`-based assertions for `icon` and grid-cell classes, and add one for `href` on the anchor.
- `frontend/specs/assets/js/components/common/SeeAllCardSpec.js`: replace the `aria-label="See all Treasures"` assertion — since this spec renders via `renderToStaticMarkup`, drop the tooltip-content assertion here (that belongs in the helper spec) and just keep/add assertions for `bi-gem` and `href` in the static markup.

### Step 4 — Manual/visual check
Run the frontend locally (or via existing dev workflow) and confirm on the Game show page (PCs/NPCs preview) and a Character show page (treasure preview) that:
- The "see more" card is now photo-only, matching the row's other cards in height/shape.
- Hovering it shows a tooltip with the "See all {{title}}" text, same placement/style as hovering a regular card.

## Files to Change
- `frontend/assets/js/components/common/helpers/SeeAllCardHelper.jsx` — remove `card-body`/stretched-link, wrap with `CardHoverTooltip`.
- `frontend/assets/js/components/common/SeeAllCard.jsx` — update doc comment only.
- `frontend/specs/assets/js/components/common/helpers/SeeAllCardHelperSpec.js` — update assertions for the new markup.
- `frontend/specs/assets/js/components/common/SeeAllCardSpec.js` — update assertions for the new markup.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No backend, i18n, or product changes are required — the existing `character_preview_section.see_all` translation key is reused unchanged.
