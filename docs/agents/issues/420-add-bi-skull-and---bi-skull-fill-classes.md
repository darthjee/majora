# Issue: Add bi-skull and bi-skull-fill classes

## Description
Bootstrap Icons (via the `bootstrap-icons` npm package, imported in `frontend/assets/js/main.jsx`) provides classes like `bi-heart-fill` and `bi-heart`, each rendering an icon glyph via a `::before` CSS rule.

`bi-skull` and `bi-skull-fill` are not part of the standard `bootstrap-icons` package. `frontend/assets/js/utils/Icons.js` already maps `skull` to `bi-skull` and `skullFill` to `bi-skull-fill`, and these classes are already referenced by `CharacterCardHelper.jsx` and `CharacterHelper.jsx` for the "Mark as Slain" / "Mark as Publicly Slain" actions. The raw SVG assets (`frontend/assets/images/icons/skull-fill.svg` and `skull-lines.svg`) were added in #419, but no CSS class currently defines `.bi-skull` or `.bi-skull-fill`.

## Problem
Because `.bi-skull` and `.bi-skull-fill` are not defined anywhere in the CSS, any element using these classes (the Slain/Publicly Slain action buttons) currently renders with no visible icon.

## Expected Behavior
Applying the `bi-skull` or `bi-skull-fill` class to an element shows the corresponding skull icon, the same way `bi-heart` / `bi-heart-fill` already work.

Per the existing mapping in `Icons.js` (and its spec, `IconsSpec.js`, which already asserts this):
- `bi-skull` — outline icon, using `frontend/assets/images/icons/skull-lines.svg`
- `bi-skull-fill` — filled icon, using `frontend/assets/images/icons/skull-fill.svg`

## Solution
Add `.bi-skull::before` and `.bi-skull-fill::before` CSS rules (in the project's own stylesheet, alongside/after the `bootstrap-icons.css` import in `frontend/assets/js/main.jsx`) that render the two existing SVGs, following the same visual pattern Bootstrap Icons uses for its own classes.

## Benefits
The "Mark as Slain" and "Mark as Publicly Slain" actions (added in #397) will display their intended skull icons instead of rendering blank.
