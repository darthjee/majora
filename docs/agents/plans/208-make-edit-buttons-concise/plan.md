# Plan: Make edit buttons concise

Issue: [208-make-edit-buttons-concise.md](../issues/208-make-edit-buttons-concise.md)

## Branch

issue-208

## Overview

Create a shared `EditButton` element component (parallel to `NewButton`) and a `PageActions`
wrapper component that keeps the Back button and any action buttons (Edit, New) in a consistent
top-level row. Replace ad-hoc button placements in `GameHelper.jsx` and `CharacterHelper.jsx`
with `PageActions + EditButton`, and migrate `GamesHelper.jsx` and `TreasuresHelper.jsx` to use
`PageActions` as well so every page shares the same layout pattern.

## Context

`NewButton` (`btn btn-primary mb-3`) already exists as a reusable element. There is no parallel
`EditButton`. In `GameHelper.jsx` the edit link is embedded inside `<h1>`, and in
`CharacterHelper.jsx` the edit button uses `mt-2` instead of `mb-3`, both inconsistent with the
listing-page pattern. A `PageActions` wrapper will hold `<BackButton>` and any number of
sibling action buttons side-by-side, replacing the current loose placement in all helpers.

## Implementation Steps

### Step 1 — Create `EditButton` element

Create `frontend/assets/js/components/elements/EditButton.jsx` modelled after `NewButton.jsx`:
- Props: `href`, `children`
- Class: `btn btn-secondary mb-3`
- Full JSDoc with `@param` and `@returns`

Create a matching spec at
`frontend/specs/assets/js/components/elements/EditButtonSpec.js` that asserts the rendered
anchor contains the given `href` and children text.

### Step 2 — Create `PageActions` element

Create `frontend/assets/js/components/elements/PageActions.jsx`:
- Props: `backHref`, `children` (the action buttons)
- Renders `<BackButton href={backHref} />` followed by `{children}` inside a `<div>`
  (no extra wrapper class needed — `BackButton` already carries `mb-3`)
- Full JSDoc

Create a matching spec at
`frontend/specs/assets/js/components/elements/PageActionsSpec.js` that asserts:
- The rendered output contains the back `href`
- The rendered output includes the children

### Step 3 — Update `GameHelper.jsx`

Replace the private `#renderEditLink` method that embeds the anchor inside `<h1>` with a
`PageActions` + `EditButton` pattern:
- Import `EditButton` and `PageActions`
- Remove the `BackButton` import (it is now used inside `PageActions`)
- Replace the raw `<BackButton href="#/games" />` with
  `<PageActions backHref="#/games">{...}</PageActions>`, including `<EditButton>` when
  `game.can_edit` is true
- Remove the `{GameHelper.#renderEditLink(game)}` call from inside `<h1>`
- Delete the `#renderEditLink` private method

Update the existing spec (`GameHelperSpec.js`) to confirm that:
- The edit link still appears when `can_edit` is true (same href assertion)
- The edit link is absent when `can_edit` is false or missing (same negative assertions)
- The game name in `<h1>` no longer contains a button (verify name renders alone)

### Step 4 — Update `CharacterHelper.jsx`

Replace the private `#renderEditButton` method that uses `mt-2` with `PageActions` +
`EditButton`:
- Import `EditButton` and `PageActions`
- Remove the `BackButton` import
- Replace `<BackButton href={backHref} />` + `{CharacterHelper.#renderEditButton(character)}`
  with a single `<PageActions backHref={backHref}>` block containing `<EditButton>` when
  `character.can_edit` is true
- Delete the `#renderEditButton` private method

Update the existing spec (`CharacterHelperSpec.js`) — the existing edit-button tests already
assert on href and text; they should continue to pass without change. Verify that the `mt-2`
class no longer appears in any rendered output.

### Step 5 — Update `GamesHelper.jsx`

Replace `<BackButton href="#/" />` + `<NewButton href="#/games/new">` with:
```jsx
<PageActions backHref="#/">
  <NewButton href="#/games/new">{Translator.t('games_page.new_game')}</NewButton>
</PageActions>
```
- Import `PageActions`, remove the direct `BackButton` import
- Keep `NewButton` import

The existing spec (`GamesHelperSpec.js`) already tests for the back href and the New Game
link; those assertions should still pass.

### Step 6 — Update `TreasuresHelper.jsx`

Same pattern as `GamesHelper.jsx`:
```jsx
<PageActions backHref="#/">
  <NewButton href="#/treasures/new">{Translator.t('treasures_page.new_treasure')}</NewButton>
</PageActions>
```
- Import `PageActions`, remove the direct `BackButton` import

## Files to Change

- `frontend/assets/js/components/elements/EditButton.jsx` — new file
- `frontend/assets/js/components/elements/PageActions.jsx` — new file
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — move edit link out of `<h1>`, use `PageActions`
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — fix spacing, use `PageActions`
- `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` — use `PageActions`
- `frontend/assets/js/components/pages/helpers/TreasuresHelper.jsx` — use `PageActions`
- `frontend/specs/assets/js/components/elements/EditButtonSpec.js` — new spec
- `frontend/specs/assets/js/components/elements/PageActionsSpec.js` — new spec
- `frontend/specs/assets/js/components/pages/helpers/GameHelperSpec.js` — update/add assertions
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSpec.js` — verify `mt-2` gone

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- `BackButton` is retained as a standalone element used by `PageActions` internally — do not delete it.
- `TreasureHelper.jsx` (single-treasure detail page) does not appear to have an edit button yet; it is out of scope for this issue.
- No translation keys need to change — `EditButton` receives its label as `children`.
