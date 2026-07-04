# Frontend Plan: Add treasure photos

Main plan: [plan.md](plan.md)

## Shared contracts

- Can rely on `POST /treasures/<id>/photo_upload.json` existing (superuser-only),
  returning `{upload_id, token, treasure_id}` — same shape `UploadClient.initUpload`
  already parses for game/character uploads.
- Can rely on `photo_path` being present on every treasure object returned by
  `/treasures.json`, `/games/<slug>/treasures.json`, and `/treasures/<id>.json`
  — `null` when no photo, a string path otherwise.
- Must gate the upload button's visibility on the existing global `isSuperUser`
  flag (via `AdminAccess.isSuperUser()`), not a per-treasure permission check.

## Implementation Steps

### Step 1 — `CardTreasureImage.jsx`: render the real photo when present

- Update `frontend/assets/js/components/elements/CardTreasureImage.jsx` to accept
  a `photoPath` (or `url`) prop and render it when present, falling back to
  `default_treasure.png` otherwise — same fallback pattern as `CardPhoto.jsx`.
  Remove the "no upload flow yet" comment.
- Update `frontend/specs/assets/js/components/elements/CardTreasureImageSpec.js`
  to cover both the photo-present and photo-absent cases.

### Step 2 — Wire the upload button into the treasure card

- `TreasureCard.jsx` / `TreasureCardHelper.jsx` currently take only `treasure`
  and wrap the whole card in an `<a href="#/treasures/<id>">`. Extend both to
  accept `isSuperUser` and an `onUploadClick(treasure)` callback, and render an
  upload button (reuse the existing hover-reveal styling from
  `PhotoUploadOverlay.jsx`/`photo-upload-overlay-button` CSS if it generalizes
  cleanly, or add an equivalent button scoped to the image area) — visible only
  when `isSuperUser` is true.
  - Since the whole card is an anchor, the upload button's click handler must
    call `event.preventDefault()`/`stopPropagation()` so clicking it opens the
    modal instead of navigating to the treasure detail page.
  - `PhotoUploadOverlay.jsx` currently hardcodes `CardPhoto`'s default image
    (`default_game.png`) — if reused here it needs a way to plug in
    `CardTreasureImage` instead (e.g. a `render`/`Photo` prop), otherwise build
    the equivalent small overlay directly in `TreasureCardHelper`. Pick
    whichever keeps the diff smallest and matches existing conventions; do not
    silently change `PhotoUploadOverlay`'s behavior for its other callers
    (`GameEditHelper`, `CharacterHelper`, `BaseCharacterEditHelper`, `GameHelper`).
- Update `TreasureCardHelperSpec.js` and `TreasureCardSpec.js` for the new props
  (button hidden when `isSuperUser` is false/omitted, shown and wired to
  `onUploadClick` when true).

### Step 3 — Wire modal state into both index pages

- `Treasures.jsx` (global index, `TreasuresController` already redirects
  non-superusers away, so `isSuperUser` is implicitly always true once the page
  renders — but still read/pass it explicitly for consistency and testability)
  and `GameTreasures.jsx` (public page — must fetch `isSuperUser` itself via
  `AdminAccess.isSuperUser()`, similar to how `HeaderController` does it, since
  `GameTreasuresController` currently has no such check).
- Add `showUploadModal`/`selectedTreasure` state to both pages, following the
  `Game.jsx` pattern: `onUploadClick={(treasure) => { setSelectedTreasure(treasure); setShowUploadModal(true); }}`,
  and render `<PhotoUploadModal show={showUploadModal} uploadPath={`/treasures/${selectedTreasure?.id}/photo_upload.json`} onClose={...} onSuccess={...} />`
  where `onSuccess` closes the modal and re-runs `controller.buildEffect()()` to
  refresh the list (picking up the new `photo_path`).
- Thread `isSuperUser` and the `onUploadClick` handler down through
  `TreasuresHelper.render`/`GameTreasuresHelper.render` to each `TreasureCard`.
- Add/extend controller specs (`TreasuresControllerSpec.js`,
  `GameTreasuresControllerSpec.js`) for the new `isSuperUser` fetch on
  `GameTreasuresController`, and page-level specs if present.

## Files to Change

- `frontend/assets/js/components/elements/CardTreasureImage.jsx`
- `frontend/assets/js/components/elements/TreasureCard.jsx`
- `frontend/assets/js/components/elements/helpers/TreasureCardHelper.jsx`
- `frontend/assets/js/components/pages/Treasures.jsx`
- `frontend/assets/js/components/pages/GameTreasures.jsx`
- `frontend/assets/js/components/pages/helpers/TreasuresHelper.jsx`
- `frontend/assets/js/components/pages/helpers/GameTreasuresHelper.jsx`
- `frontend/assets/js/components/pages/controllers/GameTreasuresController.js` — add `isSuperUser` fetch
- `frontend/specs/assets/js/components/elements/CardTreasureImageSpec.js`
- `frontend/specs/assets/js/components/elements/TreasureCardSpec.js`
- `frontend/specs/assets/js/components/elements/helpers/TreasureCardHelperSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/GameTreasuresControllerSpec.js`
- `frontend/specs/assets/js/components/pages/controllers/TreasuresControllerSpec.js`

## CI Checks

- `frontend`: `npm test` / `npm run coverage` (CI job: `jasmine`), `npm run lint` (CI job: `frontend-checks`)
- Run via: `docker-compose run --rm majora_fe npm test` and `docker-compose run --rm majora_fe npm run lint`

## Notes

- No index page has ever had a per-card action button before (only whole-page
  upload buttons like `Game.jsx`/`PcCharacter.jsx`); this is the first
  card-level interactive control, so extra care is needed to avoid nested
  interactive elements inside the card's `<a>` wrapper (accessibility/DOM
  validity), and to make sure the upload button's click doesn't trigger card
  navigation.
- `GameTreasuresController` is currently public (no superuser gate), unlike
  `TreasuresController` — its `isSuperUser` fetch is net-new work, not a
  refactor of existing gating logic.
