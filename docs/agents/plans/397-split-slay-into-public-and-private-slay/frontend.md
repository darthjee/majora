# Frontend Plan: Split slain into public and private slain

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend `PATCH /games/:game_slug/npcs/:id/slain.json` accepts `slain` and/or `public_slain` in
  the request body, and returns `{"slain": bool, "public_slain": bool}`.
- `character.slain` from list/detail endpoints already reflects the *public* value (backend
  aliases it), so existing player-facing rendering that reads `character.slain` needs no change.
  DM-facing data (`npcs/all.json`, `.../full.json`) additionally exposes `character.public_slain`
  as its own field — the DM overlay needs both `character.slain` (real, on full/all responses)
  and `character.public_slain` to drive its two buttons correctly.
- New i18n keys (produced by the translator agent): `slain_confirm_modal.public_slain_title`,
  `public_revive_title`, `public_slain_body`, `public_revive_body`, `public_slain_button`,
  `public_revive_button`.
- New icon keys needed in `Icons.js`: `skullFill` (`bi-skull-fill`) and `heartOutline`
  (`bi-heart`) — reuse the existing `heart` (`bi-heart-fill`) and `skull` (`bi-skull`) keys for
  the other two states (see plan.md's "Frontend icon keys" section for the exact real/public
  pairing).

## Implementation Steps

### Step 1 — Icons

In `frontend/assets/js/utils/Icons.js`, add:

```js
skullFill: 'bi-skull-fill',
heartOutline: 'bi-heart',
```

### Step 2 — `PhotoUploadOverlay` supports two secondary buttons

`frontend/assets/js/components/elements/PhotoUploadOverlay.jsx` currently accepts a single
`secondaryButton` prop rendered with the `photo-upload-overlay-button-right` class. Change this
to accept a `secondaryButtons` array (0–2 entries, each `{label, variant, icon, onClick}`), and
render each with its own position (e.g. stack them at the bottom-right per the issue's "on the
bottom right of the picture 2 buttons" wording). This needs a new CSS class alongside
`photo-upload-overlay-button-left`/`-right` (check the stylesheet under
`frontend/assets/scss/` for where those are defined) — add whatever second-button-position class
keeps both buttons visually distinct and within the overlay bounds. Keep backward compatibility
unnecessary — this is the only caller.

### Step 3 — Build two button definitions instead of one

In `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` (`#renderPhoto`) and
`frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` (wherever the single slain
secondary button is built, ~line 135-156), replace the single button object with two:

- Real slain button: label/variant/icon driven by `character.slain`
  (`Icons.skullFill`/`Icons.heart`), calling a new `onSlainClick`-equivalent for the *real* field.
- Public slain button: label/variant/icon driven by `character.public_slain`
  (`Icons.skull`/`Icons.heartOutline`), calling a separate handler for the *public* field.

Both callers need a second callback prop threaded through (e.g. `onPublicSlainClick`), following
the existing `onSlainClick` prop-drilling pattern in `GameCharactersHelper.jsx`.

### Step 4 — Confirm modal needs to know which field it's toggling

`SlainConfirmModal.jsx`/`SlainConfirmModalHelper.jsx` currently always uses the `slain_confirm_modal.slain_*`/`revive_*` keys. Add a `field` (or `isPublic`) prop that picks between the
existing keys and the new `public_slain_*`/`public_revive_*` keys, and pass the current value of
whichever field is being toggled instead of always `character.slain`.

### Step 5 — Controller and client accept the target field

`SlainConfirmController.js`'s `handleConfirm` hardcodes toggling `slain`. Generalize it (or add a
second controller usage) so it can toggle either `slain` or `public_slain`, and update
`CharacterClient.js`'s `setNpcSlain` (or add a sibling method) to send whichever field is being
toggled in the PATCH body, matching the backend's partial-update contract.

### Step 6 — Wire both toggles on the pages that use them

Update `frontend/assets/js/components/pages/NpcCharacter.jsx` (`useSlainExtra`) and
`frontend/assets/js/components/pages/GameNpcs.jsx` to manage two independent modal/controller
pairs (real + public), each opened by its own overlay button from Step 3.

### Step 7 — Tests

Update/add Jasmine specs under `frontend/specs/` for: `Icons`, `PhotoUploadOverlay` (two
secondary buttons), `CharacterCardHelper`, `CharacterHelper`, `SlainConfirmModal`/
`SlainConfirmModalHelper` (both field variants), `SlainConfirmController`, `CharacterClient`,
`NpcCharacter`, and `GameNpcs` — covering both the real and public toggle paths independently.

## Files to Change

- `frontend/assets/js/utils/Icons.js` — add `skullFill`/`heartOutline`.
- `frontend/assets/js/components/elements/PhotoUploadOverlay.jsx` — support two secondary buttons.
- `frontend/assets/scss/**` — new CSS class for the second overlay button position.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx` — build two button defs.
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — build two button defs.
- `frontend/assets/js/components/elements/SlainConfirmModal.jsx` — accept target field.
- `frontend/assets/js/components/elements/helpers/SlainConfirmModalHelper.jsx` — pick i18n keys per field.
- `frontend/assets/js/components/elements/controllers/SlainConfirmController.js` — toggle target field.
- `frontend/assets/js/client/CharacterClient.js` — send target field in PATCH body.
- `frontend/assets/js/components/pages/NpcCharacter.jsx` — two modal/controller pairs.
- `frontend/assets/js/components/pages/GameNpcs.jsx` — two modal/controller pairs.
- `frontend/assets/js/components/pages/helpers/GameCharactersHelper.jsx` — thread second callback.
- Corresponding spec files under `frontend/specs/` for every file above.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`) — verifies the translator agent's new keys stay in sync across `en.yaml`/`pt.yaml`.

## Notes

- `PhotoUploadOverlay`'s two-button layout is new UI (no existing precedent to copy verbatim) —
  use your judgment on exact spacing/stacking as long as both buttons stay clickable and legible
  at the card's small/normal sizes.
- Depends on the translator agent's new i18n keys existing before `check_i18n`/lint will pass.
