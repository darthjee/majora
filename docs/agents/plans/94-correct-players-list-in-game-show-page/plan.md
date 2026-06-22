# Plan: Correct players list in game show page

Issue: [94-correct-players-list-in-game-show-page.md](../issues/94-correct-players-list-in-game-show-page.md)

## Overview
On the game show page (`/#/games/:game_slug`), the character/NPC preview cards use the `size="small"` variant of `CharacterCard`, but that variant still renders at the same width as the normal cards and shows the character's name as visible text. The fix scopes changes to the `small` size only: shrink the column width classes and stop rendering the visible name `<HeadingTag>`, relying on the `alt` text already passed to `CardAvatar` to convey the name. Full list pages (`GamePcs`, `GameNpcs`) use the default size and must remain unaffected.

## Context
- `CharacterCardHelper.jsx` renders the card markup for `CharacterCard`, choosing column classes and a heading tag based on a `size` prop (`"small"` vs default `"normal"`).
- The image (`CardAvatar`) already receives `alt={character.name}`, so the name is preserved for accessibility once the visible heading is removed.
- `CharacterPreviewSectionHelper.jsx` is the only caller that passes `size="small"` (used on the game show page). `GameCharactersHelper.jsx` (used by `GamePcs`/`GameNpcs`) does not pass a `size` prop, so it keeps the current, unaffected behavior.

## Implementation Steps

### Step 1 — Reduce card column width for the small size
In `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`, change the column classes used when `size === 'small'` to smaller Bootstrap breakpoints (e.g. `col-sm-3 col-md-2 col-lg-1` or similar, smaller than the current `col-sm-4 col-md-3 col-lg-2`), so the preview cards render visibly smaller without touching the normal-size classes used elsewhere.

### Step 2 — Hide the visible character name for the small size
In the same helper, stop rendering the `<HeadingTag className="card-title">{character.name}</HeadingTag>` element when `size === 'small'`. Keep rendering it for the normal/default size so `GamePcs`/`GameNpcs` are unaffected. The name remains accessible via the existing `alt={character.name}` passed into `CardAvatar`/`<img>`.

### Step 3 — Update/add specs
Update `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` to assert:
- For `size="small"`: no visible card-title text is rendered, and the rendered markup still contains the smaller column classes.
- For the default/normal size: behavior is unchanged (visible name still rendered, original column classes).

Verify `CharacterPreviewSectionHelperSpec.js` and `GameCharactersHelperSpec.js` still pass unchanged, confirming the full list pages keep showing the name.

## Files to Change
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — shrink small-size column classes; omit the visible name heading when `size === 'small'`.
- `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js` — add/update specs covering the small-size behavior change.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run check_i18n` / JS lint (CI job: `frontend-checks`)

## Notes
- Do not change `CardAvatar.jsx` or the default/normal card rendering path — only the `small` size branch in `CharacterCardHelper.jsx` is in scope.
- Exact column class values are a judgment call for visual sizing; pick something clearly smaller than the current small-size classes while staying consistent with Bootstrap's grid conventions used elsewhere in the file.
