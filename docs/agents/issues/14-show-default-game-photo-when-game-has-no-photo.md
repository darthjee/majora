# Issue: Show Default Game Photo When Game Has No Photo

## Description

When a game has no photo URL set, the `CardPhoto` component currently renders a plain
placeholder div with the text "No image". Instead, it should render a default fallback image
stored in the frontend assets.

## Problem

- Games without a photo show a generic grey placeholder box ("No image" text).
- The application already has a default image at `frontend/assets/images/default_game.png`.
- That image is not being used anywhere — it is effectively dead code.

## Expected Behavior

- When a game's `photo` field is `null` or empty, `CardPhoto` (or its helper) should render
  the default image (`frontend/assets/images/default_game.png`) instead of the placeholder div.
- The rendered `<img>` should use the imported default image as its `src`.

## Solution

- Import `defaultGamePhoto` from `frontend/assets/images/default_game.png` in `CardPhoto.jsx`
  (Vite supports importing static assets as URLs).
- When `url` is falsy, pass `defaultGamePhoto` as the image source instead of rendering the
  placeholder div.
- Update `CardPhotoSpec.js` and any related specs to reflect the new behavior (no more
  "No image" text; a fallback `<img>` is rendered instead).

## Benefits

- Improves visual consistency — all game cards display an image, never a blank box.
- Makes use of the already-committed default asset.

---
See issue for details: https://github.com/darthjee/majora/issues/14
