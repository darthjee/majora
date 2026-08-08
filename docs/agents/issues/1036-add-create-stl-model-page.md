# Issue: Add create stl_model page

## Description
Follow-up to the STL model show/list pages added in commit `4565730cf48b9a6e060283ae839d35ed6cd99ee1`: `StlModel` currently has no way to be created through the app at all. This issue adds an admin/staff-only create form and its backing endpoints, wires up a proper default placeholder photo (fixing a pre-existing bug along the way), and adds a deferred photo-upload flow mirroring NPC creation, plus a click-to-upload link on the show page mirroring PC/NPC.

## Problem
- There is no create endpoint or form for `StlModel` at all — the only way to add one today is directly in the database/admin.
- The "wiring" for the STL model default placeholder photo doesn't exist yet, and there's a small pre-existing bug: `ActionsOverlay.jsx` maps a `photoType` string to a per-resource photo component (`CardAvatar`, `CardTreasureImage`, `CardItemImage`, `CardDocumentImage`), falling back to the generic `CardPhoto` (hardcoded to `default_game.png`) for any unrecognized type. `stlModelListType.js` already sets `photoType: 'stl_model'`, but no `'stl_model'` key exists in `PHOTO_COMPONENTS`, so the list page silently falls through to the **game** placeholder for STL models with no photo. The detail page has the same problem: `StlModelHelper.jsx` renders `<CardPhoto url={stlModel.photo_url} .../>` directly. The existing `frontend/assets/images/placeholders/default_stl_miniature.png` file isn't referenced anywhere yet.
- There is no photo-upload endpoint for `StlModel` either.

## Expected Behavior
- An admin or staff user can reach a "New STL model" form (from the STL models list page) and create a new `StlModel` with a name, optional tags, and an optional photo.
- STL models with no photo show a dedicated STL-model placeholder image (not the game placeholder) on both the list and detail pages.
- Tags are shown as badges in the left column of the show page, next to the photo.
- On the show page, an admin/staff viewer can click the photo to upload/replace it, the same way PC/NPC show pages work.
- `sources` remain empty on creation; attaching them is left for later.
- No photo-listing UI is added yet.

## Solution

### Placeholder rename & wiring
1. Rename `frontend/assets/images/placeholders/default_stl_miniature.png` → `default_stl_model.png`.
2. Add `CardStlModelImage.jsx` (like `CardTreasureImage.jsx`) that falls back to it.
3. Register it in `ActionsOverlay`'s `PHOTO_COMPONENTS` map under `'stl_model'` — this alone fixes the list page, since it already passes `photoType: 'stl_model'`.
4. Swap `StlModelHelper.jsx`'s detail page from `CardPhoto` to `CardStlModelImage`.

### Create endpoint — tags field
`StlModel.tags` is a many-to-many to `Tag`, a model explicitly described as *"a deduplicated, global tag"* (`name`, unique). The create endpoint accepts `tags` as an array of strings — no separate id-based selection.

**Frontend (create form):** a left-side element showing the current pending tags as `Badge`s, plus a text input + "Add" button next to it. Typing one or more comma-separated values and either pressing Enter or clicking "Add" splits the input on `,`, trims each piece, and appends them to the pending tags list (rendered as badges) before the form is submitted.

**Backend:** the create serializer takes `tags` as a list of strings, capped at **20 entries** per request (same purpose as `CharacterLinksSync`'s `MAX_LINKS`: bound per-entry DB queries). For each string: lowercase it, then `Tag.objects.get_or_create(name=<lowercased>)` and attach it to the new `StlModel`. Lowercasing applies to both the existence check and creation, so tags are case-insensitive and never duplicated by casing (e.g. `"Goblin"` and `"goblin"` resolve to the same `Tag`).

**Show page:** the tag badges move from their current spot in the right column (`StlModelHelper.#renderTags`, alongside links/sources) into the left column, next to the photo — matching the create form's left-side layout. They no longer render in the right column.

**Related, unrelated-resource tweak requested alongside this:** `CharacterLinkWriteSerializer`'s `MAX_LINKS` drops from 50 to **10**.

**Edge cases:**
- Each tag string is validated against `Tag.name`'s DB `max_length=200` in the create serializer (a per-field check before `get_or_create` runs), so an over-long tag returns a normal `400` validation error rather than whatever the DB layer would otherwise do. A broader pass on validation-error consistency across the codebase is tracked separately in issue #1037.
- After splitting the comma-separated input, each piece is trimmed; blank pieces (e.g. a trailing comma) and pieces that case-insensitively duplicate one already in the pending list are silently dropped — the badges list never shows blanks or visual duplicates.

### Create endpoint — sources field
`sources` is out of scope for creation: the create endpoint doesn't accept it at all, and new `StlModel`s are created with an empty `sources` list. No UI for it on the create form either. Attaching sources is left for a later feature (e.g. edit).

### Create endpoint — permissions
Not a literal copy of `treasures_list`'s approach — a nuance changes what applies:
- `treasures_list`'s `GET` is intentionally public, so the whole endpoint uses `@permission_classes([AllowAny])`, and `_create_treasure` manually calls `require_authenticated()` (401) then inline-checks `request.user.is_superuser or request.user.is_staff` (403).
- `stl_models_list`'s `GET` already requires `@permission_classes([IsAuthenticated])` — it's not public — so the `AllowAny`-plus-manual-401 dance treasure needs doesn't apply here; DRF already returns 401 for unauthenticated requests on both `GET` and the new `POST`.
- There's a shared, cache-backed `require_staff(request)` helper in `games/views/common.py` (backed by `AdminOrStaffCache`) that `accounts` and `staff` apps already import cross-app for exactly this admin-or-staff gate — the more current, reused pattern, rather than treasure's inline `is_superuser or is_staff` check.

Decision: `stl_models_list`'s new `POST` branch keeps `@permission_classes([IsAuthenticated])` as-is (covers 401 for both methods already), and calls `require_staff(request)` (imported from `games.views.common`, same cross-app import style `accounts`/`staff` already use) for the 403 admin/staff gate.

### Create form/page (frontend)
Mirrors the `treasure` create trio (`TreasureNew.jsx` / `TreasureNewController.js` / `TreasureNewHelper.jsx`), with one structural difference from how treasure gates access.

**Page/controller/helper**, new files under `frontend/assets/js/components/resources/stl_model/pages/`:
- `StlModelNew.jsx` — holds form state (`name`, pending `tags` list, the tag-input text), wires `StlModelNewController`.
- `controllers/StlModelNewController.js` — mirrors `TreasureNewController`: `buildEffect()` redirects any non-staff/superuser viewer away (`AccessStore.ensureStaffOrSuperUser()` → `window.location.hash = '/'`); `submitForm()` re-checks staff/superuser, then `RequestStore.mutate`s a `POST` to the `stlModel` collection endpoint with `{ name, tags }`; handles `201` (redirect to `#/stl_models/:id`), `400` (per-field errors), other failures (generic error state).
- `helpers/StlModelNewHelper.jsx` — renders the form: a `FormField` for `name`, the tags badges+input component (per the tags-field decision above), a submit button. No `sources` field (out of scope, per that decision).

**Access-gating difference from treasure:** treasure's whole `/treasures` list page redirects non-staff/superuser away via `TreasuresAccessController` (so its "New Treasure" button is unconditionally shown — only staff ever reach that page). STL models keep `/stl_models` open to all authenticated users, so instead:
- `StlModels.jsx` gains a small access check (`AccessStore.ensureStaffOrSuperUser()` resolved into state), and `StlModelsHelper.render()` only renders the "New STL model" `NewButton` (linking to `#/stl_models/new`) when that resolves `true`. The list itself keeps rendering regardless.
- `StlModelNew`'s own `buildEffect()`/`submitForm()` redirect-away checks (above) remain as the real backstop, exactly like treasure's page-level gate.

**Routing:** add `['/stl_models/new', 'stlModelNew']` to `HashRouteResolver.js` (ordered before the `/stl_models/:id`-equivalent detail route, matching treasure's `/treasures/new` vs `/treasures/:id` ordering), and register `stlModelNew: <StlModelNew />` (with the matching import) in `AppHelper.jsx`.

**`resourceConfig`:** extend `stlModelConfig.js` (currently `GET`-only) with a `POST.collection` `create` entry pointing at `/miniatures/stl_models.json`, `regular`/`private` both pointing at the same object (no restricted/full variant, same as treasure's standalone create) — permission is enforced server-side and by the page-level gates above, so `permission` here is documentation-only like treasure's.

### Photo upload flow
Mirrors NPC creation's **deferred upload** pattern on the frontend (pick a photo before the record exists, upload it as a second step right after creation succeeds), backed by treasure's existing **single, always-replaced photo** endpoint shape on the backend (closer structural match than npc's photo history, since `StlModel.photo` is one representative photo like `Treasure.photo`).

**Backend:** new `POST /miniatures/stl_models/:id/photo_upload.json`, view `stl_model_photo_upload.py` mirroring `treasure_photo_upload.py`:
- Deterministic path via `PhotoPathBuilder(['stl_models', stl_model_id], f'photo{ext}', use_uuid=False)` (no random stem — a `StlModel` has at most one photo, always replaced, same as treasure).
- Reuse-or-create the `StlModelPhoto` on `stl_model.photo`, same shape as treasure's `_reuse_or_create_photo`.
- Permission: `require_staff(request)` — not treasure's `EndpointPermission` game/ownership check, since STL models have no owning-game concept at all and creation is already admin/staff-only end to end; the photo-upload gate matches that.

**`resourceConfig`:** add a `POST.single` init entry to `stlModelConfig.js` pointing at the new endpoint, mirroring treasure's `photoUploadInit`.

**Frontend create form:** a new `StlModelPhotoField.jsx` (same shape as `CharacterAvatarField.jsx`, falling back to the renamed `default_stl_model.png`) lets the user pick a file before the STL model exists, via `PhotoUploadModal`'s `deferred` mode (kept as a local `File` + preview). `StlModelNewController.submitForm` mirrors `GameNpcNewController`:
1. `POST` to create the STL model (name + tags, no photo).
2. On `201`, if a photo was picked, run `PhotoUploadSaga` against the resolved photo-upload path for the new id.
3. On upload success: purge the `stlModel` cache, redirect to the detail page.
4. On upload failure: set a `photo-upload-failed` status, keep the created id, and offer a retry action (mirroring `GameNpcNewController#retryPhotoUpload`/`#failPhotoUpload`).
5. If no photo was picked, redirect to the detail page immediately after creation.

### Show page photo link
Mirrors PC/NPC's detail-page pattern specifically (click the photo itself to open the upload modal) — not treasure's, which has no click-to-upload on its standalone detail page at all (treasure's upload only happens from the list page's per-card overlay button). The issue's own wording ("with link on the character photo") points at the PC/NPC shape.

PC/NPC resolve the overlay's `canEdit` from permission fields already embedded in the character payload (`can_edit`/`is_player`/`is_staff`). STL models have no such per-object concept — creation and photo upload are both uniformly staff-only — so `canEdit` here is resolved the same way as the list page's "New" button and the create page's gate: `AccessStore.ensureStaffOrSuperUser()`, not a new field on `StlModelDetailSerializer`.

Changes to `StlModel.jsx`/`StlModelHelper.jsx`:
- `StlModel.jsx` gains `isStaffOrSuperUser` (resolved via `AccessStore.ensureStaffOrSuperUser()`) and `showUploadModal` state.
- `StlModelHelper.render` swaps its current direct `<CardPhoto url={stlModel.photo_url} .../>` for `<ActionsOverlay type="stl_model" url={stlModel.photo_url} alt={stlModel.name} canEdit={isStaffOrSuperUser} onClick={handlers.onOpenUploadModal} />` — reusing the `'stl_model'` `PHOTO_COMPONENTS` entry registered in the placeholder-wiring topic.
- A `PhotoUploadModal` renders alongside, `uploadPath` resolved from the `stlModel` `POST.single` init entry added in the photo-upload-flow topic; `onSuccess` purges the `stlModel` cache and refetches, mirroring `Treasures.jsx`'s `handleUploadSuccess`.

### Photos listing
Confirmed out of scope, per the original issue text — no changes here.

## Benefits
- Admins/staff can finally create `StlModel` catalog entries from the app instead of the database/admin.
- Fixes a pre-existing bug where STL models with no photo silently showed the wrong (game) placeholder.
- Reuses established patterns (treasure create/photo-upload, NPC deferred photo upload, character-links batch create) instead of inventing new ones, keeping the codebase consistent.
