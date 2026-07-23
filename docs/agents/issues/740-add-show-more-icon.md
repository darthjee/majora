# Issue: Add show more icon

## Description
On some pages, the collapsible `DescriptionBox` component (shared by `game.description`, `pc`/`npc` `public_description`, and `pc`/`npc` `private_description`) shows a text-only "Show more" / "Show less" toggle button, rendered by `DescriptionBoxHelper#renderToggle` (`frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx:39-53`).

## Problem
The toggle currently renders as a plain text link-button (`btn btn-link btn-sm`) using the `description_box.show_more` / `description_box.show_less` translation keys directly as visible label text.

## Expected Behavior
The toggle button renders as an icon instead of visible text:
- Collapsed state: `arrows-expand` icon, tooltip text from `description_box.show_more`.
- Expanded state: `arrows-collapse` icon, tooltip text from `description_box.show_less`.

The translation keys keep the same meaning but are now used as the tooltip/accessible text rather than the visible label.

## Solution
- Add `arrowsExpand: 'bi-arrows-expand'` and `arrowsCollapse: 'bi-arrows-collapse'` entries to the central icon map (`frontend/assets/js/utils/ui/Icons.js`), following the existing naming convention there.
- Update `DescriptionBoxHelper#renderToggle` (`frontend/assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx:39-53`) to render an `<i className="bi ...">` icon instead of the translated label text, keeping the existing `btn btn-link btn-sm` button and `onToggle` handler.
- Wrap the button in `react-bootstrap`'s `OverlayTrigger`/`Tooltip`, matching the existing pattern used by `TooltipBadge.jsx`, `CardHoverTooltip.jsx`, `ConversationCountBadge.jsx`, and `UserAvatarBadge.jsx` (all under `frontend/assets/js/components/common/`), showing the translated text (`description_box.show_more` / `description_box.show_less`) as the tooltip content instead of introducing the native `title` attribute pattern used elsewhere (e.g. `ActionBar.jsx`).
- No changes needed to the translation files (`frontend/assets/i18n/en.yaml`, `pt.yaml`) since the existing `description_box.show_more` / `description_box.show_less` keys are reused, just repurposed as tooltip text.
- Update the existing spec (`frontend/specs/assets/js/components/common/misc/helpers/DescriptionBoxHelperSpec.js`) to assert on the icon class and tooltip content instead of visible label text.

## Benefits
- More compact, consistent iconography for the collapse/expand affordance, using the same `OverlayTrigger`/`Tooltip` pattern already established for other icon-only elements in the app.

## Scope
Limited to `DescriptionBox`/`DescriptionBoxHelper` (shared by `game.description` and `pc`/`npc` `public_description`/`private_description`) — confirmed to be the only collapsible "show more/less" text-overflow toggle in the codebase. Other components using the word "collapse" (`TreasureValueFieldSlot.jsx`, `ViewAsModalHelper.jsx`) are unrelated form-section toggles, not this pattern.
