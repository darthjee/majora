# Issue: Use description component on item pages

## Description
Item show pages render the item's `description` field as a plain `<p>` tag instead of using the shared, collapsible `DescriptionBox` component already used on character and game show pages.

## Problem
On the item detail pages, the description is rendered as raw, unstyled text with no truncation:
- `/#/games/:game_slug/pcs/:character_id/items/:id` (PC item, via `PcCharacterItem`)
- `/#/games/:game_slug/npcs/:character_id/items/:id` (NPC item, via `NpcCharacterItem`)
- `/#/games/:game_slug/items/:id` (game item, via `GameItem`)

All three pages share the same rendering logic in `ItemDetailHelper.render()` (`frontend/assets/js/components/resources/item/pages/helpers/ItemDetailHelper.jsx`), where the description column is currently just:

```jsx
<div className="col-md-8">
  <p>{item.description}</p>
</div>
```

This is visually inconsistent with the PC/NPC/game show pages, which use a bordered, collapsible box for long descriptions.

## Expected Behavior
Item descriptions should render inside the same collapsible description box used on the PC show page (`/#/games/:game_slug/pcs/:id`), for a consistent look and to avoid long descriptions overwhelming the page:
- Short descriptions render normally inside the bordered box.
- Long descriptions (taller than the box's max collapsed height) show a "Show more" / "Show less" toggle.

## Solution
Reuse the existing `DescriptionBox` component (`frontend/assets/js/components/common/misc/DescriptionBox.jsx`), which already implements this exact collapsible pattern and is used for game descriptions and character public/private descriptions (via `CharacterDescriptionHelper` / `CharacterDmNotesHelper`).

In `ItemDetailHelper.jsx`, replace:

```jsx
<p>{item.description}</p>
```

with:

```jsx
<DescriptionBox description={item.description} />
```

(importing `DescriptionBox` the same way `CharacterDescriptionHelper.jsx` does). Since all three item-detail pages share `ItemDetailHelper`, this single change fixes all of them at once. Update the JSDoc and the existing spec (`frontend/specs/assets/js/components/resources/item/pages/helpers/ItemDetailHelperSpec.js`) to assert the `DescriptionBox` element instead of the `<p>`.

## Benefits
- Consistent look and behavior for descriptions across game, character, and item show pages.
- Long item descriptions no longer dominate the page — they collapse behind a "Show more" toggle like everywhere else.
- No new component needed; reuses an already-tested, shared building block.
