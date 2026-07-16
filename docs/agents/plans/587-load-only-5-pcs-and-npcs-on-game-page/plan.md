# Plan: Load only 5 PCs and NPCs on game page

Issue: [587-load-only-5-pcs-and-npcs-on-game-page.md](../issues/587-load-only-5-pcs-and-npcs-on-game-page.md)

## Overview
On the game page (`/#/games/:game_slug`), the PC and NPC preview sections fetch and render 6 characters each, driven by a single shared frontend constant, `MAX_PREVIEW_CHARACTERS` (currently `6`). Lowering this constant to `5` reduces both the fetch `per_page` and the client-side preview slice together, since both already read from the same value. This is a purely frontend, single-agent change.

## Context
- `GameController.js` fetches `pcs.json?per_page=${MAX_PREVIEW_CHARACTERS}` and `npcs.json?per_page=${MAX_PREVIEW_CHARACTERS}` (plus the authenticated `npcs/all.json` fallback via `characterClient.fetchNpcsAll(..., { per_page: MAX_PREVIEW_CHARACTERS })`).
- `CharacterPreviewSectionHelper.jsx` renders `characters.slice(0, MAX_PREVIEW_CHARACTERS)` followed by a "See all" card.
- `MAX_PREVIEW_CHARACTERS` lives in `characterPreviewConstants.js` alongside `MAX_PREVIEW_TREASURES` and `MAX_PREVIEW_PHOTOS`, which are separate constants (currently `6`) used for the treasure and photo preview sections respectively — those are out of scope and must stay unchanged.

## Implementation Steps

### Step 1 — Lower the shared preview constant
In `frontend/assets/js/components/common/characterPreviewConstants.js`, change `MAX_PREVIEW_CHARACTERS` from `6` to `5`. Leave `MAX_PREVIEW_TREASURES` and `MAX_PREVIEW_PHOTOS` untouched.

### Step 2 — Update specs that assert the old value
Update the existing Jasmine specs that hardcode `per_page=6` for the PC/NPC preview fetches and the `MAX_PREVIEW_CHARACTERS`-driven slice, so they assert `per_page=5` / a 5-item preview instead:
- `frontend/specs/assets/js/components/resources/game/pages/controllers/GameController/previewListsFetchSpec.js`
- `frontend/specs/assets/js/client/CharacterClient/fetchNpcsAllSpec.js`
- Any spec covering `CharacterPreviewSectionHelper.jsx`'s slicing behavior (search for `MAX_PREVIEW_CHARACTERS` usage/expectations under `frontend/specs/`).

Do not touch `fetchCharacterPhotosSpec.js` or any treasure-preview specs — those cover the separate, unaffected `MAX_PREVIEW_PHOTOS`/`MAX_PREVIEW_TREASURES` constants.

### Step 3 — Verify no other consumers were missed
Re-grep `frontend/assets/js` and `frontend/specs` for `MAX_PREVIEW_CHARACTERS` after the change to confirm every usage is consistent with the new value of `5`, and that no other code path independently hardcodes `per_page=6` for PCs/NPCs on the game page.

## Files to Change
- `frontend/assets/js/components/common/characterPreviewConstants.js` — change `MAX_PREVIEW_CHARACTERS` from `6` to `5`.
- `frontend/specs/assets/js/components/resources/game/pages/controllers/GameController/previewListsFetchSpec.js` — update expected `per_page` value.
- `frontend/specs/assets/js/client/CharacterClient/fetchNpcsAllSpec.js` — update expected `per_page` value.
- Any other spec asserting on `MAX_PREVIEW_CHARACTERS` (e.g. covering `CharacterPreviewSectionHelper.jsx`) — update expected preview length.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- No backend changes needed — `per_page` is already a supported query parameter; only the frontend-side default/limit changes.
- Confirm during implementation whether any other spec files reference `MAX_PREVIEW_CHARACTERS` or a hardcoded `6` in this context beyond the ones listed here (a fresh grep was not exhaustively re-run after codebase exploration for this plan).
