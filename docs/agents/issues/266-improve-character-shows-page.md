# Issue: Improve character shows page

## Description
The character show and edit pages (PC and NPC) currently lay out the photo and name/role/description side by side in a single row, with the link list rendered as a plain bulleted list at the very bottom of the show page. This issue reorganizes both pages into a two-column layout and restyles the link list as a stack of cards.

## Problem
- Photo, name, and links (identity/navigation info) are visually mixed with descriptive content (role, description, DM notes, photo gallery) instead of being grouped together, on both the show and edit pages.
- The link list uses a plain `<ul>` with default browser bullets and no visual weight, giving links no card-like affordance.
- There is no icon library installed in the frontend (no Bootstrap Icons, FontAwesome, or react-icons) to render an icon in place of the bullet.
- The edit form has no way to display the character's existing links at all today.

## Expected Behavior
- The character show page renders two columns: a narrower left column and a wider right column.
  - Left column contains, top to bottom: the character photo, the character name, and the link list only.
  - Right column contains everything else currently on the page: role, public description, private description (DM notes) when present, and the additional photos gallery.
- The character edit page adopts the same left/right grouping:
  - Left column contains: the photo (with upload overlay, unchanged), the name field, and the character's existing links displayed read-only (same card-based `LinkList` used on the show page; links stay non-editable, out of scope for this issue).
  - Right column contains: the role field, description field, private description field, and the submit button.
- Each link (on both pages) renders as its own card, stacked one below the other (not side by side), with a chain icon placeholder in place of the bullet. The entire card is clickable and opens the link, matching the click behavior of existing cards like `GameCard`/`CharacterCard`.

## Solution
- Update `CharacterHelper.render` / `CharacterInfoHelper` to build a two-column Bootstrap row: left `col-md-4` (photo, name, `LinkList`), right `col-md-8` (role, description, private description, `CharacterPhotos`) — reusing the existing `col-md-4`/`col-md-8` split already used for photo/info.
- Update `BaseCharacterEditHelper.render` to match: move the name `FormField` into the left `col-md-4` column (below the photo), add a read-only `LinkList` below it using the character's existing links, and keep role/description/private description/submit in the right `col-md-8` column.
- Add the `bootstrap-icons` npm package as a new frontend dependency and use its `bi-link-45deg` (chain) icon class as the placeholder icon.
- Redesign `LinkList` to render each link as a Bootstrap `card`, one per row (stacked vertically), with the chain icon before the link text instead of a bullet. Follow the existing card patterns in `GameCardHelper`/`CharacterCardHelper`, wrapping the whole card in the `<a>` tag so the entire card area is clickable. Reuse this same component on both the show and edit pages.

## Benefits
- Clear visual grouping: identity/navigation info (photo, name, links) is separated from descriptive content, consistently on both show and edit pages.
- Cards give links better visual affordance and a larger click target than a plain bulleted list.
- Users editing a character can see its existing links without switching back to the show page.
