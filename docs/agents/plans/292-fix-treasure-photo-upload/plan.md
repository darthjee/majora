# Plan: Fix treasure photo upload

Issue: [292-fix-treasure-photo-upload.md](../issues/292-fix-treasure-photo-upload.md)

## Overview
The "Upload Photo" button on treasure cards (global `/#/treasures` and game-nested
`/#/games/:id/treasures` pages) is unclickable because the styles that position it
above the card's `stretched-link` overlay (`.photo-upload-overlay` /
`.photo-upload-overlay-button` in `frontend/assets/css/main.scss`) are never loaded —
`main.scss` is not imported anywhere in the app. Wiring `main.scss` into the actual
build (importing it from the app's entry point, `frontend/assets/js/main.jsx`) makes
the button render `position: absolute` with `z-index: 2`, correctly stacking above the
stretched-link so clicks reach it instead of triggering navigation.

## Context
- `frontend/assets/js/main.jsx` currently imports `../../assets/css/styles.css` only.
- `frontend/assets/css/main.scss` already contains the correct
  `.photo-upload-overlay` / `.photo-upload-overlay-button` rules (`position: relative`
  on the wrapper, `position: absolute` + `z-index: 2` on the button), plus some
  general app styles (`body`, `.app`, `.card-photo-square`) that are also currently
  unused.
- `frontend/assets/css/styles.css` is a separate, currently-imported stylesheet with
  its own (overlapping but not identical) `body`/`.app` rules.
- `PhotoUploadOverlay` (`frontend/assets/js/components/elements/PhotoUploadOverlay.jsx`)
  renders the `.photo-upload-overlay` wrapper div and, when `canEdit` is true, the
  `.photo-upload-overlay-button`.
- `TreasureCardHelper` (`frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx`)
  renders the card: `PhotoUploadOverlay` on top, then a `card-body` whose title `<a>`
  carries Bootstrap's `stretched-link` class, overlaying the whole card. Without the
  missing CSS, the button sits in normal flow beneath the stretched-link's absolutely
  positioned overlay and never receives the click.
- `frontend/vite.config.js` already resolves `.scss` via the `sass` devDependency
  (already listed in `frontend/package.json`), so no new build tooling is required —
  only wiring the import.

## Implementation Steps

### Step 1 — Import `main.scss` from the app entry point
In `frontend/assets/js/main.jsx`, add an import for `../../assets/css/main.scss`
alongside the existing `../../assets/css/styles.css` import, so the
`.photo-upload-overlay` / `.photo-upload-overlay-button` rules are compiled into the
bundle. Keep both stylesheets imported (do not delete `styles.css`) unless doing so
introduces duplicate/conflicting rules — if `main.scss`'s `body`/`.app` rules should
supersede `styles.css`'s, resolve the overlap by consolidating into a single file
rather than leaving both imported with conflicting values for the same selectors.
Prefer the smallest change that fixes the bug: importing `main.scss` in addition to
`styles.css` is sufficient unless a conflict is found during verification.

### Step 2 — Verify the fix in existing specs
Run the frontend test suite and confirm `PhotoUploadOverlaySpec.js` and
`TreasureCardSpec.js` (plus `TreasuresSpec.js` / `GameTreasuresSpec.js`) still pass.
These specs render components in isolation (jsdom, no real CSS cascade/layout), so
they won't themselves catch a missing stylesheet import — this step is about not
regressing existing behavior, not proving the fix. No spec changes are expected;
the fix is a build-wiring change, not a component-behavior change.

### Step 3 — Manual/visual sanity check (optional, best-effort)
If feasible within the frontend dev environment (`docker-compose run` per project
convention), load `/#/treasures` and a game's `/#/games/:id/treasures` page as a
superuser and confirm the "Upload Photo" button now opens the upload modal instead of
navigating to the treasure detail page, for both pages.

## Files to Change
- `frontend/assets/js/main.jsx` — add `import '../../assets/css/main.scss';` so the
  overlay/button positioning rules are actually built into the app bundle.

## CI Checks
- `frontend`: `docker-compose run frontend npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run frontend npm run coverage` (CI job: `jasmine`)

## Notes
- No component or logic changes are expected — this is purely a missing-import/build
  wiring fix.
- If `main.scss`'s `body`/`.app` rules conflict visually with `styles.css`'s once both
  are loaded, consolidate them (e.g. fold `styles.css`'s font-family rule into
  `main.scss`, or vice versa) rather than importing both indefinitely — but do not
  over-engineer this beyond what's needed to fix the reported bug.
