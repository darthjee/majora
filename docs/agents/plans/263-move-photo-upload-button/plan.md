# Plan: Move photo upload button

Issue: [263-move-photo-upload-button.md](../issues/263-move-photo-upload-button.md)

## Overview
Replace the standalone "Upload Photo" buttons on the game and character edit
forms with a hover-reveal button overlaid on the photo/avatar itself, and add
the same overlay to the game/PC/NPC show pages (gated by `can_edit`). After a
successful upload, refetch the page data so the displayed photo updates
without a full reload.

## Context
- `GameEditHelper` and `BaseCharacterEditHelper` currently render a plain
  inline `<button>` to open `PhotoUploadModal`; `GameEditHelper` doesn't even
  render a photo preview today (`BaseCharacterEditHelper` does, via
  `CardAvatar`).
- `GameHelper` (game show page) and `CharacterHelper` (PC/NPC show page,
  shared) render `CardPhoto`/`CardAvatar` but have no upload affordance at
  all.
- `CardPhoto` and `CardAvatar` (`frontend/assets/js/components/elements/`)
  are also used by `GameCardHelper` and `CharacterCardHelper` for list/index
  cards — they must NOT be modified directly, since the button must never
  appear on index/list pages. A new wrapper component is needed instead.
- `PhotoUploadModal` already exists and takes `show`, `uploadPath`, `onClose`,
  `onSuccess` — reuse it unchanged, only the trigger and `onSuccess` behavior
  change.
- Every page effect is built via `controller.buildEffect()()`. `PcCharacter.jsx`
  and `NpcCharacter.jsx` already re-invoke it on auth change
  (`AuthEvents.subscribe`) — the same call re-triggers a full refetch
  (including the photo URL) and is the natural way to "refresh the photo in
  place" after a successful upload, instead of introducing a new client
  method.
- `game.can_edit` / `character.can_edit` are already merged onto the loaded
  entity by `GameController#buildEffect` and `CharacterController#loadCharacter`
  respectively (via the `access.json` endpoints), so show pages already have
  what they need to gate the button.
- Existing translations `game_edit_page.upload_photo_button`,
  `pc_edit_page.upload_photo_button`, `npc_edit_page.upload_photo_button`
  ("Upload Photo" / "Enviar Foto") and `photo_upload_modal.title` ("Upload
  Photo" / "Enviar Foto") already cover the needed label text — reuse
  `photo_upload_modal.title` as the accessible label for the new overlay
  button, so no new translation keys are needed and the translator agent is
  not involved.

## Implementation Steps

### Step 1 — New `PhotoUploadOverlay` component
Add `frontend/assets/js/components/elements/PhotoUploadOverlay.jsx`: wraps
`CardPhoto` or `CardAvatar` (pick via a `variant` prop, e.g. `'photo'` |
`'avatar'`) in a positioned container and renders an overlay `<button>`
(Bootstrap classes, e.g. `btn btn-secondary photo-upload-overlay-button`)
revealed on hover via CSS — only when a `canEdit` prop is `true`; renders
nothing (no button in the DOM) when `canEdit` is `false`. Props:
`variant`, `url`, `alt`, `canEdit`, `onClick`. Use
`Translator.t('photo_upload_modal.title')` as the button's `aria-label`/
visually-hidden text (icon-only or text button — match existing Bootstrap
button styling used elsewhere, e.g. `EditButton`).

### Step 2 — CSS for the hover overlay
In `frontend/assets/css/main.scss`, add a `.photo-upload-overlay` wrapper
class (`position: relative`) and `.photo-upload-overlay-button` (
`position: absolute`, centered or corner-anchored, `opacity: 0`,
`transition: opacity`), revealed via `.photo-upload-overlay:hover
.photo-upload-overlay-button { opacity: 1; }`. Keep it hover-only per the
issue (touch/mobile out of scope).

### Step 3 — Game edit page
- `GameEditHelper.render`: remove the standalone inline upload button; add
  a `PhotoUploadOverlay` (`variant="photo"`, `canEdit={true}` since this
  page is already gated on `game.can_edit`) bound to
  `handlers.onOpenUploadModal`. `GameEditHelper` currently has no photo at
  all — source the URL from the game state (`cover_photo_path`, passed
  through from `GameEdit.jsx`, mirroring how `BaseCharacterEditHelper`
  receives `profile_photo_path`).
- `GameEdit.jsx`: pass `cover_photo_path` into the state/render call; change
  `PhotoUploadModal`'s `onSuccess` to close the modal and re-run
  `controller.buildEffect()()` so the new photo shows immediately.

### Step 4 — Character edit pages (PC/NPC, shared)
- `BaseCharacterEditHelper.render`: remove the standalone inline upload
  button; wrap the existing `CardAvatar` usage with `PhotoUploadOverlay`
  (`variant="avatar"`, `canEdit={true}`) bound to
  `handlers.onOpenUploadModal`.
- `shared/CharacterEdit.jsx`: change `PhotoUploadModal`'s `onSuccess` to
  close the modal and re-run `controller.buildEffect()()`.

### Step 5 — Game show page
- `GameHelper.render`: wrap the `CardPhoto` usage with `PhotoUploadOverlay`
  (`variant="photo"`, `canEdit={game.can_edit}`) bound to a new
  `handlers.onOpenUploadModal` — update the `render` signature to accept a
  `handlers` argument (default `{}`) for this.
- `Game.jsx`: add `showUploadModal` state, render `PhotoUploadModal` with
  `uploadPath={`/games/${game.game_slug}/photo_upload.json`}`, and on
  success close the modal and re-run `controller.buildEffect()()`.

### Step 6 — Character show pages (PC/NPC)
- `CharacterHelper.render`: wrap the `CardAvatar` usage with
  `PhotoUploadOverlay` (`variant="avatar"`, `canEdit={character.can_edit}`)
  bound to a new `handlers.onOpenUploadModal` — update the `render`
  signature to accept a `handlers` argument (default `{}`); reuse the
  already-computed `segment` (`'pcs'`/`'npcs'`) for building the upload
  path, or accept an explicit `uploadPath`/`characterKind` the same way
  `shared/CharacterEdit.jsx` receives `characterKind`.
- `PcCharacter.jsx` and `NpcCharacter.jsx`: add `showUploadModal` state,
  render `PhotoUploadModal` with the appropriate
  `/games/<slug>/pcs|npcs/<id>/photo_upload.json` path, and on success close
  the modal and re-run `controller.buildEffect()()`.

### Step 7 — Specs
Add/update Jasmine specs for every touched file: `PhotoUploadOverlay` (new,
covers hover-reveal button rendering and the `canEdit=false` no-render case),
`GameEditHelper`, `BaseCharacterEditHelper`, `GameHelper`, `CharacterHelper`,
`GameEdit`, `CharacterEdit` (shared), `Game`, `PcCharacter`, `NpcCharacter` —
verify the old inline buttons are gone, the overlay renders/doesn't render
per `can_edit`, and `onSuccess` triggers a refetch (effect re-run) rather
than only closing the modal.

## Files to Change
- `frontend/assets/js/components/elements/PhotoUploadOverlay.jsx` — new hover-reveal upload overlay component
- `frontend/assets/css/main.scss` — hover-reveal overlay styles
- `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx` — replace inline button with overlay on photo
- `frontend/assets/js/components/pages/GameEdit.jsx` — pass photo, refetch on upload success
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — replace inline button with overlay on avatar
- `frontend/assets/js/components/pages/shared/CharacterEdit.jsx` — refetch on upload success
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — add overlay on show page photo, gated by `can_edit`
- `frontend/assets/js/components/pages/Game.jsx` — add upload modal + refetch on success
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — add overlay on show page avatar, gated by `can_edit`
- `frontend/assets/js/components/pages/PcCharacter.jsx` — add upload modal + refetch on success
- `frontend/assets/js/components/pages/NpcCharacter.jsx` — add upload modal + refetch on success
- Jasmine specs under `frontend/specs/` mirroring each of the above (new spec for `PhotoUploadOverlay`, updates to the rest)

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`, no key changes expected but must still pass)

## Notes
- No backend, infra, proxy, or translation changes are required — this is a
  frontend-only issue. No new API endpoints or serializer fields, so the
  `data-access`/`security` review agents have nothing new to check, and the
  Navi warm-up config is unaffected.
- Touch/mobile devices are explicitly out of scope per the issue; hover-only
  CSS is acceptable.
- `docs/agents/issues/263-move-photo-upload-button.md` already carries a
  `tags: :shipit:` marker (pre-approval), so the PR for this issue can skip
  the review-and-wait loop once CI passes.
