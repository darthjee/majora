# Plan: Replace buttons text by icons

Issue: [395-replace-buttons-text-by-icons.md](../issues/395-replace-buttons-text-by-icons.md)

## Overview

Replace the visible text on the "Upload Photo", "Revive", and "Mark as Slain" buttons with Bootstrap Icons glyphs, while preserving the original text as the accessible name (`aria-label` and `title`). All affected buttons are rendered through two shared, central components — `PhotoUploadOverlay.jsx` and `UploadButton.jsx` — plus the two helpers that feed the secondary Slain/Revive button (`CharacterCardHelper.jsx` and `CharacterHelper.jsx`). Because these components are shared, changing them once naturally covers every page listed in the issue (Game, Game edit, NPC list, NPC detail, PC detail, Treasures, and the three photo-list pages), including the NPC/PC edit pages that reuse `PhotoUploadOverlay` even though they were not explicitly re-listed in the issue body. This is a frontend-only change — no backend, infra, proxy, or translation-key work is needed, since the existing translated strings (`photo_upload_modal.title`, `character_page.revive_button`, `character_page.slain_button`, and the three `*_character_photos_page.upload` / `game_photos_page.upload` keys) already hold the exact text to reuse as the accessible name.

## Context

Several buttons across the app currently show only text: "Upload Photo" (rendered by `PhotoUploadOverlay.jsx` and `UploadButton.jsx`), "Revive", and "Mark as Slain" (both rendered via `PhotoUploadOverlay.jsx`'s secondary button slot, fed by `CharacterCardHelper.jsx` on the NPC list page and `CharacterHelper.jsx` on the NPC detail page). The project already depends on Bootstrap Icons (`bootstrap-icons` npm package, already used in `LinkIcon.jsx` via `<i className="bi bi-...">`), so no new icon assets are needed — `bi-camera-fill`, `bi-heart-fill`, and `bi-skull` cover camera, heart, and skull respectively.

## Implementation Steps

### Step 1 — Central icon name mapping

Add a small shared constant module, e.g. `frontend/assets/js/utils/Icons.js`, exporting named icon class constants (camera, heart, skull) so the Bootstrap Icons class string is defined in exactly one place and can be swapped later without touching call sites. Example shape:

```js
export default {
  camera: 'bi-camera-fill',
  heart: 'bi-heart-fill',
  skull: 'bi-skull',
};
```

### Step 2 — `PhotoUploadOverlay.jsx`: icon-only primary and secondary buttons

- `renderUploadButton`: replace the `Translator.t('photo_upload_modal.title')` text child with an `<i className={`bi ${Icons.camera}`} aria-hidden="true"></i>` icon, and set both `aria-label` and `title` on the `<button>` to the same translated string (still `Translator.t('photo_upload_modal.title')`).
- `renderSecondaryButton`: it currently renders `secondaryButton.label` as the button's text child. Add an `icon` field to the secondary button definition (populated by the callers in Step 3) and render `<i className={`bi ${icon}`} aria-hidden="true"></i>` instead of the label text, while keeping `aria-label` and `title` set to `secondaryButton.label` on the `<button>`.
- Keep the existing `btn btn-secondary`/`btn-${variant}` chrome classes unchanged on both buttons — only the content and the two new accessibility attributes change.

### Step 3 — Feed the Revive/Slain icon from the two helpers

- `CharacterCardHelper.jsx` (`#renderPhoto`): when building the `secondaryButton` object passed to `PhotoUploadOverlay`, add `icon: character.slain ? Icons.heart : Icons.skull` alongside the existing `label`/`variant`/`onClick`.
- `CharacterHelper.jsx` (`#buildSecondaryButton`): same addition — `icon: character.slain ? Icons.heart : Icons.skull` in the returned object.

### Step 4 — `UploadButton.jsx`: icon-only button with accessible name

This component currently takes `children` as the button's visible label (used by `BaseCharacterPhotosHelper.jsx`, `GamePhotosHelper.jsx`, and `CharacterTreasuresHelper.jsx` — but per the issue, only the two *photos list* usages, `BaseCharacterPhotosHelper.jsx` and `GamePhotosHelper.jsx`, are in scope; `CharacterTreasuresHelper.jsx`'s "Add Treasure" button is a different label/feature and is out of scope).

- Add an explicit `label` prop to `UploadButton` (the accessible text) alongside the existing `children` (now used only for the icon element), and set `aria-label={label}` and `title={label}` on the `<button>`. Keep the `btn btn-secondary mb-3` classes unchanged.
- Update `BaseCharacterPhotosHelper.jsx` and `GamePhotosHelper.jsx` to pass `label={Translator.t(...upload key...)}` and render `<i className={`bi ${Icons.camera}`} aria-hidden="true"></i>` as the children, in place of the current translated text child.
- Leave `CharacterTreasuresHelper.jsx`'s `UploadButton` usage (`{Translator.t('game_treasures_page.add_treasure')}`-style text) unchanged — its button/label is not one of the buttons listed in the issue.

### Step 5 — Update specs

Update the Jasmine specs that currently assert on visible button text for the components touched above, so they instead assert on the icon class and on the `aria-label`/`title` attributes:
- `frontend/specs/assets/js/components/elements/PhotoUploadOverlay/uploadButtonSpec.js`
- `frontend/specs/assets/js/components/elements/PhotoUploadOverlay/secondaryButtonSpec.js`
- `frontend/specs/assets/js/components/elements/UploadButtonSpec.js`
- `frontend/specs/assets/js/components/elements/helpers/CharacterCardHelperSpec.js`
- `frontend/specs/assets/js/components/pages/helpers/CharacterHelperSlainSpec.js` (and any other spec under `frontend/specs/assets/js/components/pages/helpers/CharacterHelper/` that asserts on the Revive/Slain button text)
- Specs for `BaseCharacterPhotosHelper`/`GamePhotosHelper`/NPC-PC photos pages that assert on the "Upload photo" button text, if any (grep for `.upload` translator key usage in specs under `frontend/specs/assets/js/components/pages/helpers/`).
- Add/extend a spec for the new `frontend/assets/js/utils/Icons.js` module only if project conventions require a spec for a plain constants module (check sibling `utils/*.js` for a precedent, e.g. `Noop.js`/`AllegianceBorder.js`, before deciding).

Grep the `frontend/specs` tree for the literal translated strings ("Upload Photo", "Revive", "Mark as Slain", "Upload photo") to make sure no other spec is missed.

## Files to Change

- `frontend/assets/js/utils/Icons.js` — new central icon name mapping (camera, heart, skull).
- `frontend/assets/js/components/elements/PhotoUploadOverlay.jsx` — icon-only primary and secondary buttons, `aria-label`/`title` accessibility attributes.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — pass `icon` in the secondary button definition.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — pass `icon` in the secondary button definition.
- `frontend/assets/js/components/elements/UploadButton.jsx` — add `label` prop, render icon child with `aria-label`/`title`.
- `frontend/assets/js/components/pages/helpers/BaseCharacterPhotosHelper.jsx` — pass `label` and icon child to `UploadButton` (covers NPC and PC photos pages, since this helper is shared).
- `frontend/assets/js/components/pages/helpers/GamePhotosHelper.jsx` — pass `label` and icon child to `UploadButton` (Game photos page).
- Jasmine specs listed in Step 5 above.

## CI Checks

- `frontend`: `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe npm run test` (CI job: `jasmine`)
- `frontend`: `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`) — should be unaffected since no translation keys are added, removed, or renamed.

## Notes

- `GameHelper.jsx`, `GameEditHelper.jsx`, and `BaseCharacterEditHelper.jsx` use `PhotoUploadOverlay` without a `secondaryButton` and need no changes themselves — Step 2's change to the shared component automatically gives them the icon-only primary button too.
- `TreasureCardHelper.jsx` also uses `PhotoUploadOverlay` (Treasures page, `type="treasure"`) without a `secondaryButton` — likewise covered automatically by Step 2, no direct edit needed.
- `CharacterTreasuresHelper.jsx`'s `UploadButton` ("Add Treasure") is intentionally left untouched — out of scope per the issue.
- Double-check whether any e2e/screenshot-style test depends on the visible button text; none were found during exploration, but re-run the full `npm run test` suite to confirm nothing else breaks.
- Keep `aria-hidden="true"` on the `<i>` icon elements so the icon glyph itself isn't announced redundantly alongside the button's `aria-label`.
