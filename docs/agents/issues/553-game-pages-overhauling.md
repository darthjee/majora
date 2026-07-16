# Issue: Game pages overhauling

## Description
Overhaul the game show page layout to match the two-column, photo-anchored visual pattern already used on character show pages, and align the PCs/NPCs preview sections with the card-based "see all" pattern already used for character treasures/photos previews.

## Problem
The game show page (`GameHelper.render()`) currently splits the photo/name/description into a two-column row, but everything else — the Next Session section, the open-polls widget, and the PCs/NPCs previews — renders full-width below that row instead of being anchored to the photo-sized left column like the character show page does. There is also no link from the game page to the game's treasures page. Separately, the PCs/NPCs previews end with a plain text "See all" link, unlike the character treasures/photos previews, which already replaced that link with an icon card.

## Expected Behavior

### Game show page (`/#/:game_slug`)
Two columns, the left one sized to the photo:
- **Left column, in order**: cover photo, Next Session section, Polls widget (open polls count + link), a button to the game's treasures page (`/#/games/:game_slug/treasures`).
- **Right column, in order**: game name, description, PCs preview, NPCs preview.

### PCs / NPCs preview sections
- Keep today's grid of character-card previews unchanged.
- Remove the trailing plain-text "See all Player Characters" / "See all Non-Player Characters" link.
- Append a card in its place (same pattern as the treasures/photos previews), linking to the full PCs/NPCs list page:
  - PCs card: bootstrap `file-earmark-person` icon, "See all Player Characters" as alt text.
  - NPCs card: bootstrap `file-earmark-person-fill` icon, "See all Non-Player Characters" as alt text.

### New/Edit pages (`/#/new`, `/#/:game_slug/edit`)
No layout changes. `GameEditHelper` already uses the photo-left/form-right two-column layout matching the character edit pages; `GameNewHelper` stays single-column since a game has no cover photo to show before it exists.

## Solution
1. Restructure `GameHelper.render()` so the photo (`ActionsOverlay`), the Next Session section, the `OpenPollsWidget`, and a new treasures button all render inside the left (`col-md-4`) column, and the name, description, and PCs/NPCs previews render inside the right (`col-md-8`) column — replacing today's full-width sections rendered below the row.
2. Add a button/link to the left column pointing at `/#/games/:game_slug/treasures`, reusing the existing `game_page.treasures` translation key, styled like the existing "Sessions" button.
3. Add two new icons to the shared `Icons.js` map (`bi-file-earmark-person`, `bi-file-earmark-person-fill`).
4. Update `CharacterPreviewSectionHelper` to replace its trailing text "See all" link with a `SeeAllCard`, matching how `CharacterTreasuresPreviewHelper`/`CharacterPhotosPreviewHelper` already end their grids.
5. No changes to `GameNewHelper.jsx` or `GameEditHelper.jsx` — their layout already matches or doesn't apply.

## Benefits
- Consistent visual language between game and character show pages.
- The game's treasures page becomes directly reachable from the game page.
- PCs/NPCs previews get a clearer, icon-based call to action instead of a plain text link, matching the rest of the app.
