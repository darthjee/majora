# Plan: Add show more icon

Issue: [740-add-show-more-icon.md](../issues/740-add-show-more-icon.md)

## Overview
Replace the text-only "Show more"/"Show less" toggle button in `DescriptionBoxHelper` with an icon-only button (`arrows-expand`/`arrows-collapse`), surfacing the existing translated label as a hover/focus tooltip via `react-bootstrap`'s `OverlayTrigger`/`Tooltip`, matching the pattern already used by `TooltipBadge`, `CardHoverTooltip`, `ConversationCountBadge`, and `UserAvatarBadge`.

## Context
`DescriptionBox` (`frontend/assets/js/components/common/misc/DescriptionBox.jsx`) is the single shared collapsible-description component used by `game.description` and `pc`/`npc` `public_description`/`private_description`. It delegates rendering to `DescriptionBoxHelper` (`frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx`), whose private `#renderToggle` method (lines 39-53) currently renders a `btn btn-link btn-sm` button whose visible text is the translated `description_box.show_more`/`description_box.show_less` string. This is confirmed to be the only text-overflow "show more/less" toggle in the codebase — other components matching "collapse" (`TreasureValueFieldSlot.jsx`, `ViewAsModalHelper.jsx`) are unrelated form-section toggles.

## Implementation Steps

### Step 1 — Add the icon classes to the central icon map
In `frontend/assets/js/utils/ui/Icons.js`, add two entries following the existing `camelCase key -> 'bi-kebab-case'` convention already used there:
```js
arrowsExpand: 'bi-arrows-expand',
arrowsCollapse: 'bi-arrows-collapse',
```

### Step 2 — Wrap the toggle in an OverlayTrigger/Tooltip and swap the label for an icon
In `DescriptionBoxHelper.jsx`:
- Import `Icons` from `../../../../utils/ui/Icons.js`, `OverlayTrigger` from `react-bootstrap/cjs/OverlayTrigger.js`, and `Tooltip` from `react-bootstrap/cjs/Tooltip.js` (same import paths used in `TooltipBadge.jsx`/`CardHoverTooltip.jsx`).
- In `#renderToggle`, keep computing `labelKey` as today (`description_box.show_less` when expanded, else `description_box.show_more`) and keep translating it via `Translator.t(labelKey)` — but use the translated string as the `Tooltip` content instead of the button's visible children.
- Render the button's children as `<i className={`bi ${state.expanded ? Icons.arrowsCollapse : Icons.arrowsExpand}`} aria-hidden="true"></i>` instead of the translated text.
- Wrap the `<button>` in an `OverlayTrigger` (`placement="bottom"`, `overlay={<Tooltip>{translatedLabel}</Tooltip>}`), following the `span className="d-inline-block"` wrapper pattern from `TooltipBadge.jsx` (not `CardHoverTooltip`'s `div`/`w-100`, which is sized for card layouts and would stretch a link-button).
- Keep `aria-label={translatedLabel}` on the `<button>` itself for accessibility, keep the existing `onClick={handlers.onToggle}` and `btn btn-link btn-sm p-0 mt-1` classes unchanged.

### Step 3 — Update the existing spec
In `frontend/specs/assets/js/components/common/misc/helpers/DescriptionBoxHelperSpec.js`, update the two tests currently asserting on visible `'Show more'`/`'Show less'` text (lines 55-66, 68-78):
- Assert on the icon class (`bi-arrows-expand` / `bi-arrows-collapse`) being present in the rendered markup instead of the literal label text.
- Assert the tooltip/aria text is still present, following the assertion style in `CardHoverTooltipSpec.js` (e.g. drilling into `.props.overlay.props.children` for the tooltip content, and/or checking `renderToStaticMarkup` does NOT contain the tooltip text on initial render, matching how `OverlayTrigger` defers showing its overlay).
- The `onClick`/onToggle test (lines 80-92) will need its `element.props.children[1]` traversal updated since the button is now nested one level deeper inside the `OverlayTrigger` wrapper — verify the new element shape (e.g. rendering the helper output directly and drilling into `.props.overlay`'s sibling `children` the same way `CardHoverTooltipSpec.js` does) rather than assuming the button is still a direct child at index 1.

## Files to Change
- `frontend/assets/js/utils/ui/Icons.js` — add `arrowsExpand`/`arrowsCollapse` entries.
- `frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx` — swap the toggle's visible text for an icon, wrapped in `OverlayTrigger`/`Tooltip`.
- `frontend/specs/assets/js/components/common/misc/helpers/DescriptionBoxHelperSpec.js` — update assertions for the new icon + tooltip structure.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- No translation file changes needed (`frontend/assets/i18n/en.yaml`, `pt.yaml`) — the existing `description_box.show_more`/`show_less` keys are reused verbatim, just repurposed as tooltip/aria content instead of visible label text.
- Single agent (`frontend`) — no agent split needed.
