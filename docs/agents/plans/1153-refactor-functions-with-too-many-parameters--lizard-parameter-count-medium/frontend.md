# Frontend Plan: Refactor functions with too many parameters (Lizard parameter-count-medium)

Main plan: [plan.md](plan.md)

## Overview

Codacy's Lizard analyzer flags 14 functions/methods under `frontend/` for exceeding the
8-parameter limit. Fix each by grouping related parameters into a single object, reusing
the repo's existing `context`/`handlers` grouping convention (seen today in `ListPage.jsx`,
`ShowPageLayout.jsx`, and several `*DetailHelper.jsx` files) wherever it fits, and refactoring
mirrored component + `*Helper.jsx` render pairs together so both sides share the same grouped
shape. Every call site and JSDoc block describing the old flat signature must be updated in
lockstep. There are no PropTypes in this repo, so nothing to update there.

## Context

See the issue for full background: [1153-refactor-functions-with-too-many-parameters--lizard-parameter-count-medium.md](../../issues/1153-refactor-functions-with-too-many-parameters--lizard-parameter-count-medium.md).

Decisions already locked in during discussion:
- Reuse the existing `context`/`handlers` object convention where a flagged function's
  params fit it; use judgment (checking siblings) elsewhere.
- Refactor mirrored component/helper pairs (component + its own `*Helper.jsx` static
  `render`) together, using the same grouped shape on both sides.
- `DocumentDetailHelper.jsx` and `FactionDetailHelper.jsx` have no matching flagged parent
  component (their args come from local state in the calling page component) — group them
  independently and update the call site in that page component.
- `BaseCharacterEditController.js` is a plain JS class constructor, not a React component —
  apply the same object-grouping treatment.
- Update JSDoc blocks describing the flat param lists to describe the new grouped shape
  (see `ShowPageLayout.jsx`/`ListPage.jsx` for the `@param {object} props.foo.bar` style
  already used in this repo).
- Keep this as a single issue/PR covering all 14 occurrences.

## Implementation Steps

### Step 1 — `PreviewSection.jsx` + `PreviewSectionHelper.jsx` (mirrored pair)

- `PreviewSection.jsx`: group `seeAllHref, icon` into `seeAllCard = { href, icon }`, and
  `loading, total, defaultCollapsed` into `sectionState`. Leave `items, title, maxItems,
  renderItem, emptyText` ungrouped. New signature: `(items, title, seeAllCard, maxItems,
  renderItem, emptyText, sectionState)` — 7 params.
- `PreviewSectionHelper.render`: same two groups, but `sectionState` carries `collapsed`
  (not `defaultCollapsed`) plus keep `onToggle` ungrouped (it's a callback, not part of
  either group). New signature: `(items, title, seeAllCard, maxItems, renderItem,
  emptyText, sectionState, onToggle)` — 8 params. Its private `#renderHeading`/`#renderBody`/
  `#renderEmptyText` methods keep their current flat params — `render` just destructures
  the groups back out before delegating to them.
- Update the one call site: `ShortList.jsx:48-61` builds and passes `PreviewSection`'s
  props — construct `seeAllCard`/`sectionState` there instead of the flat fields.
- Update JSDoc on both files to describe the new grouped shapes.

### Step 2 — `MultiResourcePickerField.jsx`

- Group `resource, maxEntries, values, translateOption` into `picker` (the "API mode" vs
  "constant mode" sub-shapes already documented in the existing JSDoc are one concept).
  New signature: `(picker, value, onChange, label, searchPlaceholder, removeLabel)` — 6.
- Update all 8 call sites that construct the full prop set:
  - `StlModelFiltersHelper.jsx` (race/role/source/collection filters, ~lines 89, 100, 111, 122)
  - `StlModelNewHelper.jsx` (sources/collections, ~lines 86, 95)
  - `StlModelFormFieldsHelper.jsx` (races/roles, ~lines 42, 51)
- `appendResourcePick(value, item)` is unaffected — leave as is.
- Update JSDoc.

### Step 3 — `TagsField.jsx`

- Group `onInputChange, onAdd, onRemoveTag` into `handlers` (matches repo convention), and
  `label, placeholder, addLabel, removeTagLabel` into `labels` (all i18n strings). New
  signature: `(id, tags, inputValue, errors, handlers, labels)` — 6.
- Update the 2 call sites: `StlModelFiltersHelper.jsx:140-151`, `StlModelNewHelper.jsx:73-85`.
- `handleTagsFieldKeyDown(event, onAdd)` is unaffected.
- Update JSDoc.

### Step 4 — `ListPage.jsx`

- `context` is already used for something else (item-builder context) — do not reuse that
  name for the new group. Group `filtersProps, activeFilters` into `filters = { props,
  active }`, and `onCanEditChange, onItemsChange` into `handlers`. Keep `refreshToken`
  top-level (single dominant primitive). New signature: `(type, gameSlug, basePath,
  loadingMessage, context, filters, refreshToken, handlers)` — exactly 8.
- Destructure `filters`/`handlers` back into local names internally before calling
  `ListPageHelper.render`/`ListPageController` — neither is flagged (7 params each) and
  neither needs its own signature change.
- Update the 12 call sites that pass at least one of the grouped props (of 20 total —
  the other ~8 only pass the first four args and are unaffected):
  `GameCharactersHelper.jsx`, `CharacterDocumentsHelper.jsx`, `CharacterFactionsHelper.jsx`,
  `CharacterItemsHelper.jsx`, `CharacterPossessionsHelper.jsx`, `CharacterTreasuresHelper.jsx`,
  `GameTreasuresHelper.jsx`, `TreasuresHelper.jsx`, `StlModelsHelper.jsx`,
  `CollectionsHelper.jsx`, `GameFactionsHelper.jsx`, `SourcesHelper.jsx`
  (all under `frontend/assets/js/components/resources/*/pages/helpers/`).
- Update JSDoc.

### Step 5 — `ActionsOverlay.jsx`

- Group `secondaryButtons, infoBarItems` into `overlayItems`. New signature: `(type, url,
  alt, canEdit, onClick, grayscale, dimmed, overlayItems)` — 8.
- Update the 8 call sites that pass either grouped field (of 27 total):
  `CharacterAvatarHelper.jsx` (`secondaryButtons`), `CommonItemPhoto.jsx`,
  `CharacterDocumentPhoto.jsx`, `DocumentPhoto.jsx`, `PossessionPhoto.jsx`, `ItemPhoto.jsx`,
  `ListPageHelper.jsx`, `TreasureCardHelper.jsx` (all `infoBarItems`). The other ~19 callers
  are unaffected.
- No single spec file exists — update both `frontend/specs/.../common/misc/ActionsOverlay/containerSpec.js`
  and `photoTypeSpec.js` for any assertions touching the new `overlayItems` shape.
- Update JSDoc.

### Step 6 — `PhotoUploadModal.jsx`

- Group `translationPrefix, accept, showNameField, showPhotoField, photoUploadPathBuilder`
  (the optional "file-upload variant" fields, always used together) into
  `fileUploadOptions`. New signature: `(show, uploadPath, deferred, onFileConfirmed,
  onClose, onSuccess, fileUploadOptions)` — 7.
- Only 1 of the 38 call sites needs an edit: `GameDocument.jsx:90-94` (the only caller
  passing any of the 5 grouped props). The other 37 are unaffected.
- `PhotoUploadModalHelper.render` (already 3 params) needs no change.
- Update JSDoc.

### Step 7 — `PhotoViewModal.jsx` + `PhotoViewModalHelper.jsx` (mirrored pair)

- Both files: group `canSetProfilePhoto, isProfilePhoto, onSetProfilePhoto` into
  `setProfilePhoto`, and `canDelete, onDelete` into `deletePhoto` (avoid naming it/its
  prop literally `delete` — reserved-word-adjacent destructuring risk). New signature for
  both: `(show, photo, alt, onClose, setProfilePhoto, deletePhoto)` — 6.
- In `PhotoViewModalHelper.jsx`, the private `#renderSetProfilePhotoButton`/
  `#renderDeleteButton` methods can keep flat params, or be updated to accept the group
  directly — implementer's call, either is consistent with the pattern used in Step 1.
- Update the 5 (of 6) call sites that pass a grouped field:
  `CharacterPhotos.jsx:109-118`, `CharacterDetail.jsx:145-153`, `CharacterDocument.jsx:54-60`,
  `GameDocumentPhotos.jsx:43-49`, `GameDocument.jsx:112-118`. `GamePhotos.jsx:58-63` is
  unaffected.
- Update JSDoc on both files.

### Step 8 — `BaseCharacterEditController.js`

- Group `setCharacter, setLoading, setError, setFieldErrors` into a setters object. Do
  **not** call it `setters` — the class's own instance methods (`handleSubmit`/
  `submitForm`/`applyLoadedCharacter`) already use `setters` for a differently-shaped
  `{ setStatus, setFieldErrors }` object; name this one `characterSetters` (or similar) to
  avoid confusion. Group `client, characterClient, gameClient` into `clients` (mirrors the
  constructor body's existing `this.client ?? new GenericClient()` pattern). Keep
  `loadControllerClass, getParamsFromHash, routeSegment` top-level. New signature:
  `(characterSetters, loadControllerClass, getParamsFromHash, routeSegment, clients)` — 5.
- Update the 3 `super(...)` call sites: `PcCharacterEditController.js:43-54`,
  `NpcCharacterEditController.js:43-54`, and the spec support file
  `BaseCharacterEditController/support.js:23-27` (`TestCharacterEditController`).
  `PcCharacterEditController`/`NpcCharacterEditController`'s own constructors (7 params,
  not flagged) don't need regrouping themselves — only their `super()` calls change.
- Note (do not act on unless trivial): `this.setCharacter/setLoading/setError/setFieldErrors`
  appear unused elsewhere in the class after being stored in the constructor — flagged as
  possibly-dead fields, but removing them is out of scope for this issue.
- Update JSDoc.

### Step 9 — `ExchangeDetailPane.jsx`

- Group `onQuantityChange, onConfirm, onCancel` into `handlers`. New signature: `(selected,
  quantity, owned, maxQuantity, submitting, actionError, gameType, handlers)` — 8.
- Update the 4 call sites — all already build a local `handlers` object with exactly these
  three methods, so this is close to a drop-in `handlers={handlers}`:
  `SellTreasureTabHelper.jsx:44-55`, `AcquireTreasureTabHelper.jsx:51-62`,
  `BuyTreasureTabHelper.jsx:51-62`, `RemoveTreasureTabHelper.jsx:44-55`.
- Update JSDoc.

### Step 10 — `BaseCharacterPhotosHelper.jsx`

- Group `canUploadPhoto, canSetProfilePhoto, canDeletePhoto` into `permissions`. New
  signature: `(photos, pagination, basePath, backHref, permissions, alt, profilePhotoId,
  handlers)` — 8 (the existing `handlers` object is untouched).
- Update the 1 call site: `CharacterPhotos.jsx:92-100` (via the `PhotosHelper` singleton —
  either `NpcCharacterPhotosHelper` or `PcCharacterPhotosHelper`).
- `renderLoading()`/`renderError(error)` are unaffected. Do not touch
  `GameDocumentPhotosHelper.jsx` (unrelated, only mentions this class in a comment).
- Update JSDoc.

### Step 11 — `DocumentDetailHelper.jsx`

- No matching flagged parent component; grouped independently per the issue's explicit
  instruction. Group `onUploadClick, onFileUploadClick, onSelectPhoto, onGiveDocumentClick`
  into `handlers`. New signature: `(document, backHref, editHref, canUploadPhoto, gameSlug,
  handlers)` — 6.
- Update the 1 call site: `GameDocument.jsx:90-94`.
- Optional follow-up (not required by this issue): `CharacterDocumentDetailHelper.jsx` is
  an unflagged sibling with a similar shape — worth a quick look for consistency, but out
  of scope here.
- Update JSDoc.

### Step 12 — `FactionDetailHelper.jsx`

- No matching flagged parent component; grouped independently. Group `onUploadClick,
  onRecruitClick` into `handlers`. New signature: `(faction, backHref, editHref, canEdit,
  canUploadPhoto, gameSlug, refreshToken, handlers)` — 8.
- Update the 1 call site: `GameFaction.jsx:76-79`.
- Update JSDoc.

### Step 13 — Run lint and tests

Run the full frontend lint and test suite after all 12 steps above, fixing any fallout
(missed call site, stale JSDoc, spec still asserting the old flat signature) before
opening the PR.

## Files to Change

- `frontend/assets/js/components/common/cards/PreviewSection.jsx` — group props, update JSDoc
- `frontend/assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx` — group params, update JSDoc
- `frontend/assets/js/components/common/cards/ShortList.jsx` — update call site
- `frontend/assets/js/components/common/forms/MultiResourcePickerField.jsx` — group props, update JSDoc
- `frontend/assets/js/components/resources/stl_model/pages/elements/helpers/StlModelFiltersHelper.jsx` — update call sites (×4 for MultiResourcePickerField, ×1 for TagsField)
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` — update call sites (×2 for MultiResourcePickerField, ×1 for TagsField)
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelFormFieldsHelper.jsx` — update call sites (×2 for MultiResourcePickerField)
- `frontend/assets/js/components/common/forms/TagsField.jsx` — group props, update JSDoc
- `frontend/assets/js/components/common/list_page/ListPage.jsx` — group props, update JSDoc
- `frontend/assets/js/components/resources/character/pages/helpers/GameCharactersHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterDocumentsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterFactionsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterItemsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterPossessionsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelper.jsx` — update call site
- `frontend/assets/js/components/resources/game/pages/helpers/GameTreasuresHelper.jsx` — update call site
- `frontend/assets/js/components/resources/treasure/pages/helpers/TreasuresHelper.jsx` — update call site
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/collection/pages/helpers/CollectionsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/faction/pages/helpers/GameFactionsHelper.jsx` — update call site
- `frontend/assets/js/components/resources/source/pages/helpers/SourcesHelper.jsx` — update call site
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — group props, update JSDoc
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterAvatarHelper.jsx` — update call site
- `frontend/assets/js/components/common/misc/CommonItemPhoto.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocumentPhoto.jsx` — update call site
- `frontend/assets/js/components/resources/document/pages/shared/DocumentPhoto.jsx` — update call site
- `frontend/assets/js/components/resources/possession/pages/shared/PossessionPhoto.jsx` — update call site
- `frontend/assets/js/components/resources/item/pages/shared/ItemPhoto.jsx` — update call site
- `frontend/assets/js/components/common/list_page/helpers/ListPageHelper.jsx` — update call site
- `frontend/assets/js/components/resources/treasure/pages/helpers/TreasureCardHelper.jsx` — update call site
- `frontend/assets/js/components/common/modals/PhotoUploadModal.jsx` — group props, update JSDoc
- `frontend/assets/js/components/resources/document/pages/GameDocument.jsx` — update call sites (PhotoUploadModal, PhotoViewModal, DocumentDetailHelper)
- `frontend/assets/js/components/common/modals/PhotoViewModal.jsx` — group props, update JSDoc
- `frontend/assets/js/components/common/modals/helpers/PhotoViewModalHelper.jsx` — group params, update JSDoc
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx` — update call sites (PhotoViewModal, BaseCharacterPhotosHelper)
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDocument.jsx` — update call site
- `frontend/assets/js/components/resources/document/pages/GameDocumentPhotos.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js` — group constructor params, update JSDoc
- `frontend/assets/js/components/resources/character/pages/controllers/PcCharacterEditController.js` — update `super()` call
- `frontend/assets/js/components/resources/character/pages/controllers/NpcCharacterEditController.js` — update `super()` call
- `frontend/assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPane.jsx` — group props, update JSDoc
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/SellTreasureTabHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/AcquireTreasureTabHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/BuyTreasureTabHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/elements/tabs/helpers/RemoveTreasureTabHelper.jsx` — update call site
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterPhotosHelper.jsx` — group params, update JSDoc
- `frontend/assets/js/components/resources/document/pages/helpers/DocumentDetailHelper.jsx` — group params, update JSDoc
- `frontend/assets/js/components/resources/faction/pages/helpers/FactionDetailHelper.jsx` — group params, update JSDoc
- `frontend/assets/js/components/resources/faction/pages/GameFaction.jsx` — update call site

Spec files to update alongside their source (same grouped shape must be reflected in test setup):
- `frontend/specs/assets/js/components/common/cards/PreviewSectionSpec.js`
- `frontend/specs/assets/js/components/common/cards/helpers/PreviewSectionHelperSpec.js`
- `frontend/specs/assets/js/components/common/forms/MultiResourcePickerFieldSpec.js`
- `frontend/specs/assets/js/components/common/forms/TagsFieldSpec.js`
- `frontend/specs/assets/js/components/common/list_page/ListPageSpec.js`
- `frontend/specs/assets/js/components/common/misc/ActionsOverlay/containerSpec.js`
- `frontend/specs/assets/js/components/common/misc/ActionsOverlay/photoTypeSpec.js`
- `frontend/specs/assets/js/components/common/modals/PhotoUploadModalSpec.js`
- `frontend/specs/assets/js/components/common/modals/PhotoViewModalSpec.js`
- `frontend/specs/assets/js/components/common/modals/helpers/PhotoViewModalHelperSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController/support.js` (and its sibling spec files that import it: `applyLoadedCharacterSpec.js`, `buildEffectSpec.js`, `submitFormSpec.js`)
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPaneSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterPhotosHelperSpec.js`
- `frontend/specs/assets/js/components/resources/document/pages/helpers/DocumentDetailHelperSpec.js`
- `frontend/specs/assets/js/components/resources/faction/pages/helpers/FactionDetailHelperSpec.js`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`, runs with coverage in CI via `npm run coverage`)

## Notes

- All 14 proposed grouped shapes land at or under the 8-parameter Lizard limit (see the
  issue for the exact per-function counts).
- Several call-site files listed above are shared by more than one step (e.g.
  `GameDocument.jsx`, `CharacterPhotos.jsx`) — touch them once per step, but be careful not
  to regress an earlier step's edit while doing a later one.
- `ActionsOverlay.jsx` and `BaseCharacterEditController.js` have no single dedicated spec
  file (specs are split by concern into subdirectories) — locate all relevant spec files
  before editing, not just the ones named after the source file.
- `BaseCharacterEditController.js`: avoid naming the new setters group `setters` — that
  name is already used elsewhere in the same class for a different shape
  (`{ setStatus, setFieldErrors }`).
- Do not remove the apparently-unused `this.setCharacter/setLoading/setError/setFieldErrors`
  fields on `BaseCharacterEditController` — flagged as possibly dead code, but out of scope
  for this issue.
- Because most of these are widely-called shared components (`ActionsOverlay` alone has 27
  call sites, `PhotoUploadModal` 38, `ListPage` 20), double-check the full call-site list
  with a fresh grep before starting each step — new call sites may have been added since
  this plan was written.
