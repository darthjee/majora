# Issue: Fix treasure photo upload

## Description
On both the global treasures listing page (`/#/treasures`) and the nested game treasures page (`/#/games/:id/treasures`), each treasure card overlays an "Upload Photo" button on top of the treasure image, while the card title uses Bootstrap's `stretched-link` utility to make the whole card navigate to the treasure detail page (`/#/treasures/:id`) on click.

## Problem
Clicking the "Upload Photo" button does not open the upload modal. Instead, the click is captured by the card's stretched link, and the browser navigates to the treasure detail page as if the card itself had been clicked. Reproduced on desktop with a mouse click; mobile/touch has not been tested.

Root cause: the styling that is supposed to keep the upload button positioned and stacked above the stretched-link overlay (`.photo-upload-overlay` / `.photo-upload-overlay-button` rules, including `position: absolute` and `z-index: 2`) lives in `frontend/assets/css/main.scss`, but that file is never imported anywhere in the app. The actual entry point (`frontend/assets/js/main.jsx`) only imports `frontend/assets/css/styles.css`, a separate, unrelated stylesheet. Because `main.scss` is never built into the bundle, the upload button renders with no positioning/z-index, so it sits in normal document flow behind the stretched-link's absolutely-positioned, z-indexed overlay, and captures none of the clicks intended for it.

## Expected Behavior
Clicking the "Upload Photo" button should open the photo upload modal for that treasure and must not trigger navigation to the treasure detail page, on both the global and game-nested treasures pages.

## Solution
Wire `main.scss` (or its relevant rules) into the actual build so the `.photo-upload-overlay`/`.photo-upload-overlay-button` styles take effect — e.g. import it from `main.jsx` (or merge/consolidate it with `styles.css`, whichever fits the project's styling conventions better). Verify afterward that the button, once actually styled, correctly stacks above the stretched-link on click for both the global and nested treasures pages.

---

Tags: :shipit:
