# Make edit buttons concise

## Context

The edit buttons on the game detail page and character detail page are positioned inconsistently with the rest of the UI. The games listing page already has a correct pattern: the "New Game" button sits right beside the Back button at the top of the page. The edit buttons on detail pages do not follow this pattern.

In `CharacterHelper.jsx`, the edit button is rendered as a sibling to `BackButton` but uses a different spacing class (`mt-2` instead of `mb-3`), making it visually inconsistent. In `GameHelper.jsx`, the edit link is embedded inside the `<h1>` tag alongside the game title, so it appears in the heading area rather than at the top navigation level beside the Back button.

## What needs to be done

**Frontend:**
1. Create a new `EditButton` element component (parallel to `NewButton`) with consistent styling (`btn btn-secondary mb-3`).
2. Create a new `PageActions` component that wraps the Back button and any action buttons (Edit, New, etc.) in a consistent top-level row.
3. Replace the ad-hoc button placements in `GameHelper.jsx` (edit link inside `<h1>`) and `CharacterHelper.jsx` (edit button with incorrect spacing) with `PageActions` using the new `EditButton`.
4. Migrate `GamesHelper.jsx` and `TreasuresHelper.jsx` to use `PageActions` as well for uniform layout across all pages.

## Acceptance criteria

- [ ] A new `EditButton` element component exists with `btn btn-secondary mb-3` styling
- [ ] A new `PageActions` component wraps the Back button and action buttons in a consistent row
- [ ] `GameHelper.jsx` no longer embeds the edit link inside `<h1>`; it uses `PageActions` with `EditButton`
- [ ] `CharacterHelper.jsx` uses `PageActions` with `EditButton` and consistent spacing
- [ ] `GamesHelper.jsx` and `TreasuresHelper.jsx` use `PageActions` for uniform layout
- [ ] All existing specs pass and new specs cover the new components

Tags: :shipit: :construction:
