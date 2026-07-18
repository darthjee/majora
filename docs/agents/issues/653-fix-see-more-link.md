# Issue: Fix see more link

## Description
On the Game show page and Character (PC/NPC) show pages, preview sections list items (PCs, NPCs, treasures) as cards showing only a photo, with the item name exposed via a hover tooltip. Each preview section ends with a "see more" card that links to the full list. This card does not follow the same visual pattern as the other item cards in the row.

## Problem
The "see more" card (`SeeAllCard`/`SeeAllCardHelper`) renders an extra `card-body` section used only to hold an invisible `stretched-link` anchor with an `aria-label`. Regular item cards (`CharacterPreviewCardHelper`, `TreasurePreviewCardHelper`) have no such text section — they are photo-only and show the item name via the `CardHoverTooltip` component on mouse over. The "see more" card does not use `CardHoverTooltip` at all, so hovering it shows no tooltip, unlike every other card in the row.

## Expected Behavior
- The "see more" card should not render a text/`card-body` section — it should be photo-only, matching the visual structure of a regular item card.
- On mouse over, the "see more" card should show a tooltip with the "See all {{title}}" text, the same way regular cards show a tooltip with their name.

### Affected Pages
- Game show page `/#/games/:game_slug`: PCs preview section, NPCs preview section
- PC show page `/#/games/:game_slug/pcs/:id`: Treasure preview section
- NPC show page `/#/games/:game_slug/npcs/:id`: Treasure preview section

## Solution
Update `SeeAllCard` (`frontend/assets/js/components/common/SeeAllCard.jsx`) and its helper (`helpers/SeeAllCardHelper.jsx`) to:
- Remove the `card-body` / `stretched-link` markup.
- Wrap the card with the existing `CardHoverTooltip` component (already used by `CharacterPreviewCardHelper` and `TreasurePreviewCardHelper`), passing the "See all {{title}}" text (`character_preview_section.see_all` i18n key) as the tooltip content instead of only setting it as `aria-label`.

## Benefits
- Consistent visual pattern across all preview cards.
- Clearer hover affordance for the "see more" card, matching user expectations set by the other cards in the row.
