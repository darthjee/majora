# Plan: Add bi-skull and bi-skull-fill classes

Issue: [420-add-bi-skull-and---bi-skull-fill-classes.md](../issues/420-add-bi-skull-and---bi-skull-fill-classes.md)

## Overview
Define two custom CSS icon classes, `.bi-skull` and `.bi-skull-fill`, that render the existing `frontend/assets/images/icons/skull-lines.svg` and `skull-fill.svg` assets respectively, so the already-wired call sites for the Slain/Publicly Slain actions show an actual icon instead of nothing.

## Context
`bi-heart` / `bi-heart-fill` come from the `bootstrap-icons` npm package (imported as a font-icon stylesheet in `frontend/assets/js/main.jsx`), which has no skull icon. `frontend/assets/js/utils/Icons.js` already maps `skull` → `bi-skull` and `skullFill` → `bi-skull-fill`, and `CharacterCardHelper.jsx` / `CharacterHelper.jsx` already render `<i className="bi bi-skull">` / `<i className="bi bi-skull-fill">` (via `ActionsOverlay.jsx:68`, `<i className={\`bi ${icon}\`} aria-hidden="true">`). The shared `bi` class (from `bootstrap-icons.css`) provides the icon box sizing/vertical-align; only the glyph itself (`::before` content) is missing for these two classes. `IconsSpec.js` already asserts `bi-skull` is the **outline** icon and `bi-skull-fill` is the **filled** one, matching the `-fill` naming convention used by `bi-heart` / `bi-heart-fill` — so:
- `bi-skull` → `skull-lines.svg` (outline)
- `bi-skull-fill` → `skull-fill.svg` (filled)

No new JS behavior is needed — the class names are already produced and consumed correctly; this is a pure CSS addition.

## Implementation Steps

### Step 1 — Add the icon CSS rules
In `frontend/assets/css/main.scss` (where other custom, non-Bootstrap component styles already live, e.g. `.card-photo-square`), add a rule set for `.bi-skull` and `.bi-skull-fill`. Since these are arbitrary monochrome SVGs (not glyphs in an icon font), render them via a `mask-image` on the `::before` pseudo-element sized to `1em` so they inherit `currentColor` the same way Bootstrap Icons' own font glyphs do (so `text-danger`/variant-driven coloring on the `<i>` continues to work unchanged):

```scss
.bi-skull::before,
.bi-skull-fill::before {
  content: "";
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

.bi-skull::before {
  mask-image: url("../images/icons/skull-lines.svg");
  -webkit-mask-image: url("../images/icons/skull-lines.svg");
}

.bi-skull-fill::before {
  mask-image: url("../images/icons/skull-fill.svg");
  -webkit-mask-image: url("../images/icons/skull-fill.svg");
}
```

Adjust selectors/paths if the frontend agent finds a more idiomatic location or an existing icon-mixin pattern already in the codebase, but the resulting classes must satisfy: applying `bi-skull` or `bi-skull-fill` alongside the existing `bi` class renders the corresponding SVG, sized and colored consistently with the other `bi-*` icons used next to them (e.g. `bi-heart`, `bi-heart-fill`, `bi-trash-fill`).

### Step 2 — Verify existing call sites render correctly
No code changes are needed in `Icons.js`, `CharacterCardHelper.jsx`, `CharacterHelper.jsx`, or `ActionsOverlay.jsx` — they already reference the correct class names. Manually verify (e.g. via `npm run dev` and viewing a character card's Slain/Publicly Slain actions) that the icons now render instead of showing blank space.

### Step 3 — Run the existing test suite
The class-name assertions already exist and pass today (`IconsSpec.js`, `CharacterCardHelperSpec.js`, `CharacterHelperSlainSpec.js`, `secondaryButtonSpec.js`) since they only check for the class string in rendered HTML, not visual rendering. Run the suite to confirm nothing regresses; no new specs are required for this pure-CSS change.

## Files to Change
- `frontend/assets/css/main.scss` — add `.bi-skull` / `.bi-skull-fill` icon rules.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — confirms existing class-name specs still pass

## Notes
- `mask-image`/`-webkit-mask-image` requires a `-webkit-` prefix for full Safari support; both are included above. If browser support becomes a concern, an inline base64-encoded `content: url("data:image/svg+xml;base64,...")` fallback is an alternative, but loses `currentColor` theming.
- No backend, proxy, infra, or translation changes are involved.
