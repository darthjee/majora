# Frontend Plan: Add miniatures/collection

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md#shared-contracts) for the full endpoint/field contract this agent consumes
(`GET /miniatures/collections.json`, `GET /miniatures/collections/<id>.json`,
`POST /miniatures/collections.json`, `POST /miniatures/collections/<id>/photo_upload.json`) —
all gated the same way `source`'s config already is (`staff-or-superuser` for create/upload).

## Implementation Steps

### Step 1 — Resource config & routing

- `frontend/assets/js/utils/requests/config/collectionConfig.js` — mirror `sourceConfig.js`'s GET
  collection/single/create/photo-upload path definitions.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — add
  `['/miniatures/collections/:id', 'collection']` and `['/miniatures/collections', 'collections']`
  to `ROUTES`, in the same position as the `sources` entries.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import `Collection`/`Collections` page
  components and register them under the `collection`/`collections` page keys, mirroring the
  existing `source`/`sources` registration.
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — add a
  `logged-in`-gated `Nav.Link href="#/miniatures/collections"` using a new
  `header.nav_collections` translation key, mirroring the `nav_sources` link.

### Step 2 — Pages

Under `frontend/assets/js/components/resources/collection/pages/`, mirror the `source` resource's
file set 1:1:
- `Collections.jsx` + `helpers/CollectionsHelper.jsx` — index page. List row extends
  `SourceListItem`'s `photo_url` + `name` shape with the `stl_model_count` field from the list
  serializer.
- `Collection.jsx` + `helpers/CollectionHelper.jsx` — show page. Extends the base
  `id`/`name`/`url`/`photo_url` rendering with: linked source (name, linking to
  `#/miniatures/sources/:id` when `source` is non-null) and linked stl_models (rendered list,
  each linking to its own stl_model show page).
- `elements/CollectionNewModal.jsx` + `elements/helpers/CollectionNewModalHelper.jsx` +
  `elements/CollectionPhotoField.jsx` — create modal: `name`, `url`, `photoFile` only (no
  `source` picker — `source` starts `null` on create, see [plan.md](plan.md#shared-contracts)).
- `controllers/CollectionController.js` — mirrors `SourceController.js`.
- `controllers/CollectionNewController.js` — mirrors `SourceNewController.js`'s deferred-upload
  saga (create first, then upload `photoFile` against the new id via
  `POST /miniatures/collections/<id>/photo_upload.json` if one was picked).

### Step 3 — List type & card image

- `frontend/assets/js/components/common/list_types/CollectionListItem.js` +
  `configs/collectionListType.js` — mirror `SourceListItem.js`/`sourceListType.js`; register the
  new type in `listTypeConfig.js`.
- `frontend/assets/js/components/common/cards/CardCollectionImage.jsx` — mirror
  `CardSourceImage.jsx`, falling back to a new `default_collection.png` placeholder.
- `frontend/assets/images/placeholders/default_collection.png` — new placeholder asset (see
  Notes — needs an actual image, not just wiring).

### Step 4 — i18n

Mirror `Source`'s translation file set exactly, for both `en` and `pt`:
- `frontend/assets/i18n/{en,pt}/collection_new_page.yaml`
- `frontend/assets/i18n/{en,pt}/collection_page.yaml`
- `frontend/assets/i18n/{en,pt}/collections_page.yaml`
- Add the new `header.nav_collections` key to `frontend/assets/i18n/{en,pt}/common.yaml`.
- Register the three new yaml files in `frontend/assets/i18n/{en,pt}/index.js`.

### Step 5 — Specs

Add Jasmine specs mirroring every new file under `frontend/specs/...`, following the project's
`specs/` mirrors `assets/js/` convention (one spec per new component/controller/helper).

## Files to Change

- `frontend/assets/js/utils/requests/config/collectionConfig.js` (new)
- `frontend/assets/js/utils/routing/HashRouteResolver.js`
- `frontend/assets/js/components/helpers/AppHelper.jsx`
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`
- `frontend/assets/js/components/resources/collection/pages/**` (new — see Step 2)
- `frontend/assets/js/components/common/list_types/CollectionListItem.js`,
  `configs/collectionListType.js`, `listTypeConfig.js`
- `frontend/assets/js/components/common/cards/CardCollectionImage.jsx` (new)
- `frontend/assets/images/placeholders/default_collection.png` (new)
- `frontend/assets/i18n/{en,pt}/collection_new_page.yaml`, `collection_page.yaml`,
  `collections_page.yaml`, `common.yaml`, `index.js`
- `frontend/specs/**` — mirrors of all new files above

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`) — Jasmine specs for all new files.
- `frontend`: `npm run lint` and `npm run check_i18n` (CI job: `frontend-checks`) — the latter
  specifically catches any `en`/`pt` key mismatch across the new i18n files.

## Notes

- `default_collection.png` is a real asset that needs producing (or reusing an existing generic
  placeholder), not just a code reference — flagging as an unknown; `CardSourceImage.jsx`'s
  `default_source.png` is the closest precedent for size/format.
- No changes needed on any `StlModel` create/edit form — the `collections` relationship is
  model/DB-level only for this issue (see [plan.md](plan.md#shared-contracts)).
