# Plan: Show Default Game Photo When Game Has No Photo

## Overview

Replace the "No image" placeholder in `CardPhoto` with a real fallback image. When a game has
no photo URL, render the default image asset (`default_game.png`) instead of the grey placeholder
div. Update specs accordingly.

## Context

`CardPhoto.jsx` currently branches on `url`: renders an `<img>` when a URL is present, and a
placeholder `<div>` with "No image" text when it is absent. A default image already exists at
`frontend/assets/images/default_game.png` but is unused. Vite supports importing static image
files as URL strings, so the fix requires no build configuration changes.

## Implementation Steps

### Step 1 — Import the default image in `CardPhoto.jsx`

Add a top-level import:

```js
import defaultGamePhoto from '../../images/default_game.png';
```

Vite resolves this at build time to the hashed asset URL.

### Step 2 — Use the default image as fallback

Replace the placeholder `<div>` branch with:

```jsx
return <img src={defaultGamePhoto} className="card-img-top img-fluid" alt={alt} />;
```

Both the `url` and the no-`url` branches now render an `<img>`, so the component simplifies to
a single `src` expression:

```jsx
export default function CardPhoto({ url, alt }) {
  return (
    <img
      src={url || defaultGamePhoto}
      className="card-img-top img-fluid"
      alt={alt}
    />
  );
}
```

### Step 3 — Update `CardPhotoSpec.js`

- Remove the "renders a placeholder" and "renders a placeholder when url is undefined" cases
  that assert `No image` / absence of `<img>`.
- Add cases asserting that when `url` is `null` or `undefined`, an `<img>` is still rendered
  and its `src` contains the default image path.

The `GameCardHelperSpec.js` case "renders a placeholder when photo is null" must also be updated
to expect an `<img>` instead of "No image".

## Files to Change

- `frontend/assets/js/components/elements/CardPhoto.jsx` — import default image, simplify to
  single `<img>` with `url || defaultGamePhoto` as `src`
- `frontend/specs/assets/js/components/elements/CardPhotoSpec.js` — update specs for new
  fallback behavior
- `frontend/specs/assets/js/components/elements/helpers/GameCardHelperSpec.js` — update the
  null-photo test case

## Notes

- Jasmine specs run in Node via `react-dom/server`; Vite asset imports (`.png`) are not
  processed by Node. The `jsx-loader.mjs` stub may need to handle `.png` imports and return a
  fixed string (e.g., `'default_game.png'`) so specs can assert on the `src` attribute.
- No backend changes required.
