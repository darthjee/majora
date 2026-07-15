# Issue: Character view overhauling

## Description
Overhaul the Character show, new, and edit pages's layout and componentization.

## Problem
The Character show/new/edit pages currently do not follow a consistent 2-column layout, and several sections are not isolated into their own components:
- Profile Avatar and DM Notes are rendered inline (in `CharacterHelper.jsx` and `BaseCharacterEditHelper.jsx`) rather than as standalone components.
- Role and Description are combined into a single `CharacterInfo` component instead of being separate.
- Show and edit pages duplicate their own avatar/links/money rendering rather than sharing dedicated components.
- Treasures currently renders as a full-width section below the columns (same as Photos) instead of living in the right column.
- On the show page, the "See all Treasures" and "See all Photos" sections end with a plain link instead of a card matching the rest of the list. No reusable `PhotoCard` component exists yet (Photos preview uses inline card markup with `CardPhoto`), while Treasures already reuses `TreasureCard`.

Note: the app already has a precedent for this 2-column layout — `GameHelper.jsx` (game show page) uses the same `container` > `row` > `col-md-4`/`col-md-8` structure.

## Expected Behavior
### General, for all pages (show, new, edit)
Split the page into 2 columns, following the existing `col-md-4`/`col-md-8` convention used by the game show page (`GameHelper.jsx`):

**Left column** (smaller, sized like the current profile avatar)
- Profile Avatar (own component)
- Links (own component)
- Money breakdown (own component) — *show/edit pages only, see New page scope below*

**Right column** (bigger, sized like the current description)
- Role (own component, split out of the current combined `CharacterInfo`)
- Description (own component, split out of the current combined `CharacterInfo`)
- DM Notes (own component) — *show/edit pages only, see New page scope below*
- Treasures (own component) — *show/edit pages only, see New page scope below*; moves here from its current full-width placement below the columns

### New page scope
The new (NPC creation) page has no persisted character yet, so Money breakdown, Treasures, and Photos do not apply. Its 2-column layout only includes:
- Left column: Profile Avatar, Links
- Right column: Role, Description, DM Notes

### Show and edit: display vs. edit variants
Each section component (Avatar, Links, Money, Role, Description, DM Notes) is built as a distinct read-only variant for the show page and a distinct editable variant for the edit page, matching the existing architectural split between `CharacterHelper`/show rendering and `BaseCharacterEditHelper`/edit form fields. This replaces the current duplicated inline implementations with proper standalone components per variant.

### Show page only
After the two columns, keep a full-width Photos section at the bottom (unlike Treasures, Photos does **not** move into the right column).

**Treasures** (now rendered in the right column)
- Keep the limited list of treasures.
- Replace the "See all Treasures" link with a card (styled like a treasure card, reusing `TreasureCard`) appended to the end of the list.
- The card shows the bootstrap `gem` icon instead of a photo.
- Card text remains "See all Treasures".

**Photos** (full-width section below the columns, as today)
- Keep the limited list of photos.
- Replace the "See all Photos" link with a card (styled like a photo card) appended to the end of the list. A new reusable `PhotoCard` component should be introduced (mirroring `TreasureCard`), since none exists yet.
- The card shows the bootstrap `camera` icon instead of a photo.
- Card text remains "See all Photos".

## Benefits
- Clearer visual hierarchy and more consistent layout across Character show/new/edit pages, matching the existing convention already used on the game show page.
- Reusable, isolated components (Profile Avatar, Links, Money breakdown, Role, Description, DM Notes, Treasures) simplify future maintenance and remove duplicated inline rendering between show and edit pages.
- Consistent card-based UI for "See all" actions in Treasures and Photos sections.
