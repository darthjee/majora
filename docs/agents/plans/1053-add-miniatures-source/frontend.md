# Frontend Plan: Add miniatures source

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the four endpoints/response shapes from [plan.md](plan.md)'s "Shared contracts"
section (built by [backend.md](backend.md)), and the i18n keys listed there (built by
[translator.md](translator.md)).

## Implementation Steps

Every step below is a near-1:1 structural mirror of the existing `stl_models`/`stl_model`
feature (`frontend/assets/js/components/resources/stl_model/`), substituting a single `url`
text field for `tags`, and dropping everything `StlModel`-specific (`tags`, `links`, nested
`sources`).

### Step 1 — Resource config

New `frontend/assets/js/utils/requests/config/sourceConfig.js`, mirrors `stlModelConfig.js`:
`GET.collection`/`GET.single` → `/miniatures/sources.json` / `/miniatures/sources/:id.json`
(both `permission: null`, `regular`===`private`, `IsAuthenticated` enforced server-side);
`POST.collection` (create) / `POST.single` (photo-upload init) → same paths, both
staff/superuser-gated server-side, same `regular`===`private` shape as `stlModelConfig.js`.

Register it in `frontend/assets/js/utils/requests/resourceConfig.js`: import + `source:
sourceConfig`.

### Step 2 — Routes

`frontend/assets/js/utils/routing/HashRouteResolver.js`: add to `ROUTES`, right next to the
existing `stl_models`/`stl_model` entries:
```js
['/miniatures/sources/:id', 'source'],
['/miniatures/sources', 'sources'],
```

`frontend/assets/js/components/helpers/AppHelper.jsx`: import `Sources`/`Source` (Step 3) and
register `sources: <Sources />, source: <Source />` in the page-key map, next to the existing
`stlModels`/`stlModel` entries.

### Step 3 — Pages, controllers, helpers, elements

Under a new `frontend/assets/js/components/resources/source/pages/` folder:

- `Sources.jsx` — mirrors `StlModels.jsx`: owns `showNewModal`/`refreshToken` state, resolves
  `useStaffOrSuperUser`, renders `SourcesHelper.render(...)` + `SourceNewModal`.
- `Source.jsx` — mirrors `StlModel.jsx`: fetches via `SourceController`, resolves
  `useStaffOrSuperUser`, renders `SourceHelper.render(...)` + `PhotoUploadModal` for the
  click-to-upload flow, purging `RequestStore` (`resource: 'source'`) before refetch on upload
  success — same as `StlModel.jsx`'s `handleUploadSuccess`.
- `controllers/SourceController.js` — mirrors `StlModelController.js` (fetch-only, no
  `AccessStore` merge — `sources` has no per-item edit concept embedded in the payload either).
  `getSourceIdFromHash` extracts `:id` from `/miniatures/sources/:id`.
- `controllers/SourceNewController.js` — mirrors `StlModelNewController.js`'s deferred-photo-
  upload flow (create first with `{name, url}`, then upload the picked photo against the new id;
  `retryPhotoUpload`/`#failPhotoUpload` on upload failure), swapping `tags` for `url` in the
  create body and dropping the tags-specific logic entirely (no `buildTagsAfterAdd` equivalent
  needed).
- `helpers/SourcesHelper.jsx` — mirrors `StlModelsHelper.jsx`: `PageActions` back button + a
  "New Source" button gated on `isStaffOrSuperUser`, then `<ListPage type="sources"
  basePath="#/miniatures/sources" loadingMessage={Translator.t('sources_page.loading')}
  refreshToken={refreshToken} />`.
- `helpers/SourceHelper.jsx` — mirrors `StlModelHelper.jsx` but simpler (no tags/links/sources
  sections): back button, `ActionsOverlay type="source"` (click-to-upload photo when
  `isStaffOrSuperUser`), `<h1>{source.name}</h1>`, and — when `source.url` is present — a link
  rendered the same way `StlModelHelper`'s links are (`target="_blank" rel="noreferrer"`, label
  via `Translator.t('source_page.url')`).
- `elements/SourceNewModal.jsx` — mirrors `StlModelNewModal.jsx`: owns
  `name`/`url`/`photoFile`/`showUploadModal`/`createdId`/`status`/`fieldErrors` state, the same
  `photoPreviewUrl` object-URL lifecycle, `resetForm`/`handleClose`/`handleSuccess`, and renders
  `SourceNewModalHelper.render(...)` + a deferred `PhotoUploadModal`. No tags state at all.
- `elements/helpers/SourceNewModalHelper.jsx` — mirrors `StlModelNewModalHelper.jsx`'s
  `Modal`/`Modal.Header`/`Modal.Body`/`Modal.Footer` shell, but a single-column body: photo field,
  then `name` `FormField`, then `url` `FormField` (no `TagsField`, no two-column split — there's
  nothing to put in a second column).
- `elements/SourcePhotoField.jsx` — mirrors `StlModelPhotoField.jsx`, using `ActionsOverlay
  type="source"`.

### Step 4 — Card image, list item, list type, ActionsOverlay registration

- New `frontend/assets/js/components/common/cards/CardSourceImage.jsx`, mirrors
  `CardStlModelImage.jsx`, falling back to a new `default_source.png` placeholder (Step 5).
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx`: add `source: CardSourceImage`
  to `PHOTO_COMPONENTS` (import it), extend the `type` jsdoc union with `'source'`.
- New `frontend/assets/js/components/common/list_types/SourceListItem.js`, mirrors
  `StlModelListItem.js` (`photoUrl` reads `data.photo_url`; `displayText` inherited unchanged
  since `name` already matches `BaseListItem`'s default).
- New `frontend/assets/js/components/common/list_types/configs/sourceListType.js`, mirrors
  `stlModelListType.js`: `fetchSources` via `fetchRequestStoreList({resource: 'source', ...})`,
  `buildReadOnlyActionBarProps`-equivalent (no per-item manage affordance on the list — the photo
  upload only happens from the detail page, same as `stlModels`), empty info-bar items,
  `buildItemHref` → `#/miniatures/sources/${item.data.id}`, `itemsPerRow: 6`.
- `frontend/assets/js/components/common/list_types/listTypeConfig.js`: import `sourceListType`,
  add `sources: sourceListType` to the exported config object, next to the existing `stlModels`
  entry.

### Step 5 — Placeholder image

New `frontend/assets/images/placeholders/default_source.png` — a new placeholder image
(reuse/derive from the existing `default_stl_model.png`/`default_treasure.png` style so it's
visually consistent; exact art is an implementation-time call, not a planning-time one).

### Step 6 — Header nav link (parity addition)

`frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`: add
`<Nav.Link href="#/miniatures/sources">{Translator.t('header.nav_sources')}</Nav.Link>` next to
the existing `header.nav_stl_models` link — not explicitly requested by the issue, but added for
navigation parity with `stl_models` (flagged in [plan.md](plan.md)'s Notes-equivalent; call this
out in the PR description since it's a small scope addition beyond the issue's literal text).

### Step 7 — Tests (Jasmine specs)

Mirror every `frontend/specs/.../stl_model/**` spec file for the new `source` structure —
`Sources_spec.jsx`, `Source_spec.jsx`, `SourceController_spec.js`,
`SourceNewController_spec.js`, `SourcesHelper_spec.jsx`, `SourceHelper_spec.jsx`,
`SourceNewModal_spec.jsx`, `SourceNewModalHelper_spec.jsx`, `SourcePhotoField_spec.jsx`,
`CardSourceImage_spec.jsx`, `SourceListItem_spec.js`, `sourceListType_spec.js` — same test
shapes as their `stl_model` counterparts, adjusted for the `url`-instead-of-`tags` field and the
simpler (no links/tags/sources) detail view.

## Files to Change

- `frontend/assets/js/utils/requests/config/sourceConfig.js` — new
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `source`
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add `source`/`sources` routes
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register `source`/`sources` pages
- `frontend/assets/js/components/resources/source/pages/Sources.jsx` — new
- `frontend/assets/js/components/resources/source/pages/Source.jsx` — new
- `frontend/assets/js/components/resources/source/pages/controllers/SourceController.js` — new
- `frontend/assets/js/components/resources/source/pages/controllers/SourceNewController.js` — new
- `frontend/assets/js/components/resources/source/pages/helpers/SourcesHelper.jsx` — new
- `frontend/assets/js/components/resources/source/pages/helpers/SourceHelper.jsx` — new
- `frontend/assets/js/components/resources/source/pages/elements/SourceNewModal.jsx` — new
- `.../elements/helpers/SourceNewModalHelper.jsx` — new
- `frontend/assets/js/components/resources/source/pages/elements/SourcePhotoField.jsx` — new
- `frontend/assets/js/components/common/cards/CardSourceImage.jsx` — new
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — register `source` type
- `frontend/assets/js/components/common/list_types/SourceListItem.js` — new
- `frontend/assets/js/components/common/list_types/configs/sourceListType.js` — new
- `frontend/assets/js/components/common/list_types/listTypeConfig.js` — register `sources`
- `frontend/assets/images/placeholders/default_source.png` — new
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — add nav link
- `frontend/specs/...` — one spec file per new source file above (mirroring `stl_model` specs)

## CI Checks

- `frontend`: `cd frontend && npm run coverage` (CI job: `jasmine`) and `npm run lint`
  (CI job: `frontend-checks`)

## Notes

- The header nav link (Step 6) and its `header.nav_sources` i18n key are a small addition beyond
  the issue's literal scope, done for consistency with `stl_models`; flag it explicitly in the PR
  description rather than folding it in silently.
- `CardSourceImage`'s placeholder art (Step 5) is an implementation-time decision.
