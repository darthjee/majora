# Issue: Dont show item description in tooltip

## Problem
In `/#/games/:game_slug/pcs/:id`, in the items preview list, hovering the mouse over an item shows a tooltip with the item's name and description. The description should not be shown there — only the name.

## Expected Behavior
Hovering an item in the items preview list shows a tooltip with only the item's name, not its description.

## Solution
Update `ItemPreviewCardHelper.jsx` (`frontend/assets/js/components/common/cards/helpers/ItemPreviewCardHelper.jsx`) to build the tooltip content from the item's name only, dropping the description branch.

Note: `ItemPreviewCard` is shared between the PC and NPC character show pages (both render items preview lists via `CharacterHelper.jsx`), so this change affects both pages, not just the PC page named in the issue.
