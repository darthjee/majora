# Plan: Move text to alt text

Issue: [567-move-text-to-alt-text.md](../issues/567-move-text-to-alt-text.md)

## Overview
The shared `SeeAllCard` component (used by the game page's PCs list and NPCs list, the Character Photos preview, and the Character Treasures preview) currently renders a Bootstrap icon next to visible "See all ..." text inside the card's link. This plan changes `SeeAllCardHelper` so the text is applied as the link's `aria-label` instead of being rendered as visible content, making all four "See all" cards icon-only while remaining accessible to screen readers.

## Context
- The card markup lives in `SeeAllCardHelper.render(icon, text, href)` (`frontend/assets/js/components/common/helpers/SeeAllCardHelper.jsx`), invoked by `SeeAllCard.jsx`, which is a plain pass-through component.
- Callers already build the full translated string before passing it in as `text` (e.g. `CharacterPreviewSectionHelper.jsx:25` does `Translator.t('character_preview_section.see_all').replace('{{title}}', title)`), so no caller changes or translation key changes are needed — only how `SeeAllCardHelper` renders that string.
- The four call sites sharing this component: `CharacterPreviewSectionHelper.jsx` (game page PCs/NPCs lists), `CharacterPhotosPreviewHelper.jsx`, and `CharacterTreasuresPreviewHelper.jsx`.
- The codebase already has an established icon-only-link pattern: `PageLink.jsx` puts the accessible text in an `aria-label` prop on the `<a>`, matching what this issue asks for.
- This is a purely frontend change — no backend, translation-file, or infra work is required.

## Implementation Steps

### Step 1 — Move visible text to `aria-label` on the link
In `frontend/assets/js/components/common/helpers/SeeAllCardHelper.jsx`, change the `<a>` so it no longer renders `{text}` as children, and instead sets `aria-label={text}` on the `<a>`. Leave `aria-hidden="true"` on the icon `<i>` as-is (it's still a purely decorative element, and the accessible name for the interactive control now lives on the anchor itself).

### Step 2 — Update the existing spec
In `frontend/specs/assets/js/components/common/helpers/SeeAllCardHelperSpec.js`, update the assertions that currently check for visible text (`expect(html).toContain('See all Photos')`) to instead check for `aria-label="See all Photos"` (or equivalent substring), keeping the existing coverage for icon class, `href`, `stretched-link`, and grid-cell column classes intact.

### Step 3 — Check `SeeAllCardSpec.js` for related assertions
Read `frontend/specs/assets/js/components/common/SeeAllCardSpec.js` and update any assertion there that also checks for visible text, for consistency with Step 2.

### Step 4 — Manual/visual sanity check
Run the frontend dev server and visually confirm the PCs list, NPCs list, Character Photos preview, and Character Treasures preview "See all" cards now show only the icon (no visible text), and that hovering/inspecting the link exposes the `aria-label` (e.g. via browser devtools accessibility inspector).

## Files to Change
- `frontend/assets/js/components/common/helpers/SeeAllCardHelper.jsx` — move `text` from visible `<a>` content to `aria-label` on the `<a>`.
- `frontend/specs/assets/js/components/common/helpers/SeeAllCardHelperSpec.js` — update assertions to match the new `aria-label`-based markup.
- `frontend/specs/assets/js/components/common/SeeAllCardSpec.js` — update assertions if they also assert visible text.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- Since `SeeAllCard` is shared across four call sites, this single component change affects all of them at once — no per-caller changes are needed.
- No translation key changes are required; only how the already-translated string is applied to the DOM changes.
