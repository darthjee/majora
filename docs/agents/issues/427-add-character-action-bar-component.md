# Issue: Add character action bar component

## Description
On the NPC/PC show pages (`/#/games/:game_slug/npcs/:id`, `/#/games/:game_slug/pcs/:id`) and index pages (`/#/games/:game_slug/npcs`, `/#/games/:game_slug/pcs`), the character picture shows a row of buttons (photo upload, slain toggle, public-slain toggle, revive) at the bottom of the picture, appearing on mouse-over.

## Problem
Today this is already centralized in one component, `ActionsOverlay` (`frontend/assets/js/components/elements/ActionsOverlay.jsx`), which owns the picture, the hover CSS, the upload button, and the caller-supplied `secondaryButtons` row. But the upload button and the secondary-buttons row are rendered inline inside `ActionsOverlay` itself (`renderUploadButton`/`renderSecondaryButtons`), rather than as their own named, reusable unit — and the logic that *builds* the secondary-button array is duplicated almost identically between the show-page helper (`CharacterHelper#buildSecondaryButtons`) and the index-card helper (`CharacterCardHelper`'s analogous method). Neither the issue's "single place to look for" nor "a place to refer to on future issues" (e.g. #416's upcoming player-facing slain button) is fully true yet.

## Expected Behavior
- No visual or behavioral change: buttons still appear at the bottom of the picture, still only on mouse-over, for the same routes as today.
- The upload button + secondary-buttons row are extracted into a single, named "action bar" component that `ActionsOverlay` renders, instead of being built inline via two private render methods.
- Future issues that add a new button to the character picture (e.g. #416) have one clear place to do it.

## Solution
- Extract a new `ActionBar` component from `ActionsOverlay.jsx`'s `renderUploadButton`/`renderSecondaryButtons` logic, keeping `ActionsOverlay`'s external prop API (`secondaryButtons`, `canEdit`, `onClick`, etc.) unchanged so none of its callers (character show/index pages, game cover photo, treasure cards) need to change.
- Preserve every behavior the existing `ActionsOverlay` specs assert (container/grayscale, photo-type switching, upload-button gating and left-modifier, secondary-button position classes and independent `onClick`s) against the new component.
- Consolidate the duplicated secondary-button array-building helper (`CharacterHelper#buildSecondaryButtons` and `CharacterCardHelper`'s equivalent) into a single shared helper, since both build the identical real-slain/public-slain button shape.

## Benefits
One place to find, test, and extend the character picture's action buttons, making it straightforward to slot in new buttons (like the player-facing slain toggle from #416) without touching `ActionsOverlay` or duplicating helper logic again.

---

Tags: :shipit:
