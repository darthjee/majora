# Frontend Plan: Fixes to miniatures

Main plan: [plan.md](plan.md)

## Shared contracts

You can rely on `backend` producing (see [plan.md](plan.md)'s "Shared contracts"):

- `POST /miniatures/collections.json` accepting optional `source_id` (int or `null`).
- `POST /miniatures/stl_models.json` accepting optional `source_ids`/`collection_ids` (arrays of
  int, default `[]`).
- `GET /miniatures/sources.json`/`GET /miniatures/collections.json` accepting an optional `name`
  query param (case-insensitive substring match), alongside the existing `per_page`.
- `GET /miniatures/stl_models/:id.json` response gaining `collections: [{name: string}]`.
- No `resourceConfig.js` changes needed — `sourceConfig.js`/`collectionConfig.js`/
  `stlModelConfig.js` already resolve the right paths for every call this plan makes through
  `RequestStore`.

You must reference (produced by `translator`, see [plan.md](plan.md)'s "Shared contracts") these
exact i18n keys — do not add translation copy yourself, only the `Translator.t(...)` call sites:
`header.nav_miniatures`, `collection_new_page.source_label`,
`collection_new_page.source_search_placeholder`, `stl_model_new_page.remove_tag_tooltip`,
`stl_model_new_page.sources_label`, `stl_model_new_page.sources_search_placeholder`,
`stl_model_new_page.collections_label`, `stl_model_new_page.collections_search_placeholder`,
`stl_model_page.collections`.

## Implementation Steps

### Step 1 — Header: "Miniatures" nav dropdown

- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`: add
  `renderMiniaturesNavLinks(state)`, mirroring `renderAdminNavLinks`'s single-check shape:
  ```jsx
  static renderMiniaturesNavLinks(state) {
    if (!state.loggedIn) {
      return null;
    }

    return (
      <NavDropdown title={Translator.t('header.nav_miniatures')} id="header-miniatures-nav-dropdown" renderMenuOnMount>
        <NavDropdown.Item href="#/miniatures/stl_models">{Translator.t('header.nav_stl_models')}</NavDropdown.Item>
        <NavDropdown.Item href="#/miniatures/sources">{Translator.t('header.nav_sources')}</NavDropdown.Item>
        <NavDropdown.Item href="#/miniatures/collections">{Translator.t('header.nav_collections')}</NavDropdown.Item>
      </NavDropdown>
    );
  }
  ```
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`: remove the 3 standalone
  `Nav.Link` items for `#/miniatures/stl_models`/`sources`/`collections`, replace with a call to
  `HeaderNavHelper.renderMiniaturesNavLinks(state)` alongside the other `renderXNavLinks(state)`
  calls.
- Update/add specs: `HeaderNavHelperSpec.js` covers the new dropdown (renders when `loggedIn`,
  `null` otherwise, contains all 3 links); `HeaderHelperSpec.js`'s existing nav-link assertions
  updated to expect the dropdown instead of standalone links.

### Step 2 — Shared `RemovableBadge` primitive

- `frontend/assets/js/utils/ui/Icons.js`: add `close: 'bi-x-lg'`.
- New `frontend/assets/js/components/common/badges/RemovableBadge.jsx` (sibling of `Badge.jsx`):
  ```jsx
  import Icons from '../../../utils/ui/Icons.js';

  export default function RemovableBadge({
    text, icon, variant = 'secondary', onRemove, removeLabel,
  }) {
    return (
      <span className={`badge bg-${variant} d-inline-flex align-items-center gap-1`}>
        {icon && <i className={`bi ${icon}`} aria-hidden="true"></i>}
        {text}
        <button type="button" className="btn btn-link p-0 text-white" aria-label={removeLabel} onClick={onRemove}>
          <i className={`bi ${Icons.close}`} aria-hidden="true"></i>
        </button>
      </span>
    );
  }
  ```
  (adjust the relative import path to match the file's actual final location).
- Add `RemovableBadgeSpec.js`: renders `text`/`icon`, clicking the remove button calls `onRemove`,
  `removeLabel` becomes the button's `aria-label`.

### Step 3 — Fix tag removal in the STL model creation form

- `frontend/assets/js/components/common/forms/TagsField.jsx`: swap `Badge` for `RemovableBadge`;
  add an `onRemoveTag(tag)` prop, wired to each badge's `onRemove`; pass
  `removeLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}`
  — actually, since `TagsField` is a generic shared component, take the remove label as a prop
  (e.g. `removeTagLabel`) from the caller rather than hardcoding a `stl_model_new_page.*` key
  inside a shared component; `StlModelNewModalHelper.jsx` passes
  `removeTagLabel={Translator.t('stl_model_new_page.remove_tag_tooltip')}` down to it.
- `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelNewModal.jsx`: add
  `handleRemoveTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag))`, pass as
  `onRemoveTag` through to `StlModelNewModalHelper.render`.
- `frontend/assets/js/components/resources/stl_model/pages/elements/helpers/StlModelNewModalHelper.jsx`:
  thread `onRemoveTag`/`removeTagLabel` into `TagsField`.
- Update specs: `TagsFieldSpec.js` (clicking a badge's remove icon calls `onRemoveTag` with that
  tag), `StlModelNewModalSpec.js`/`buildTagsAfterAdd`-adjacent tests (removing a tag updates
  `tags` state correctly, including de-duplication edge cases already covered for add).

### Step 4 — Generic resource-picker components

New files under `frontend/assets/js/components/common/forms/`:

1. **`ResourcePickerSearch.jsx`** — shared core. Props: `resource` (string), `maxEntries`
   (number), `onSelect(item)`, `searchPlaceholder` (string, caller-supplied translated text — no
   built-in i18n, matching `Badge`/`TagsField`'s convention). Owns the text input value + a 300ms
   debounce (mirror `GiveItemModal`'s `SEARCH_DEBOUNCE_MS` constant/pattern) and fetches via:
   ```js
   RequestStore.ensure({
     componentName, resource, quantityType: 'collection',
     query: { per_page: maxEntries, name: searchTerm },
   })
   ```
   Renders each result as an image+name row (`photo_url`/`name` from `SourceListSerializer`/
   `CollectionListSerializer`); clicking a row calls `onSelect(item)`.
2. **`SingleResourcePickerField.jsx`** — wraps it; controlled (`value: {id, name}|null`,
   `onChange(item|null)`, plus the same `resource`/`maxEntries`/`searchPlaceholder`/`label` props).
   No `value` → renders `ResourcePickerSearch`. `value` set → renders the picked item as a badge
   (plain `Badge`, not removable — no explicit "clear" affordance); clicking that badge re-opens
   the search (swap back to `ResourcePickerSearch`, calling `onChange` with the newly picked item
   once a new one is selected).
3. **`MultiResourcePickerField.jsx`** — wraps it; controlled (`value: {id, name}[]`,
   `onChange(newArray)`, same `resource`/`maxEntries`/`searchPlaceholder`/`label`/`removeLabel`
   props). Always renders `ResourcePickerSearch` plus, below it, the current `value` as
   `RemovableBadge`s; selecting a result appends it deduped by `id`; a badge's `onRemove` calls
   `onChange` with that item filtered out.

Add specs for all 3: `ResourcePickerSearchSpec.js` (debounced fetch via a stubbed `RequestStore`,
`onSelect` firing on row click), `SingleResourcePickerFieldSpec.js` (search↔badge swap,
`onChange` calls), `MultiResourcePickerFieldSpec.js` (append-dedup-remove behavior, `onChange`
calls).

### Step 5 — Collection creation form: source picker

- `frontend/assets/js/components/resources/collection/pages/elements/CollectionNewModal.jsx`: add
  `source`/`setSource` state (`null` initially).
- `frontend/assets/js/components/resources/collection/pages/elements/helpers/CollectionNewModalHelper.jsx`:
  render
  ```jsx
  <SingleResourcePickerField
    resource="source"
    maxEntries={4}
    value={formState.source}
    onChange={handlers.onSourceChange}
    label={Translator.t('collection_new_page.source_label')}
    searchPlaceholder={Translator.t('collection_new_page.source_search_placeholder')}
  />
  ```
- `frontend/assets/js/components/resources/collection/pages/controllers/CollectionNewController.js`:
  include `source_id: formValues.source?.id ?? null` in the `RequestStore.mutate` body.
- Update specs: `CollectionNewModalSpec.js`/`CollectionNewControllerSpec.js` cover picking a
  source and submitting with the right `source_id`, and submitting with no source picked sending
  `source_id: null`.

### Step 6 — STL model creation form: source + collection pickers

- `StlModelNewModal.jsx`: add `sources`/`setSources` and `collections`/`setCollections` state
  (both `[]` initially, reset in `resetForm` alongside `tags`).
- `StlModelNewModalHelper.jsx`: render, in the right column stacked under the tags field:
  ```jsx
  <MultiResourcePickerField
    resource="source"
    maxEntries={4}
    value={formState.sources}
    onChange={handlers.onSourcesChange}
    label={Translator.t('stl_model_new_page.sources_label')}
    searchPlaceholder={Translator.t('stl_model_new_page.sources_search_placeholder')}
  />
  <MultiResourcePickerField
    resource="collection"
    maxEntries={4}
    value={formState.collections}
    onChange={handlers.onCollectionsChange}
    label={Translator.t('stl_model_new_page.collections_label')}
    searchPlaceholder={Translator.t('stl_model_new_page.collections_search_placeholder')}
  />
  ```
- `StlModelNewController.js`: include `source_ids: formValues.sources.map((s) => s.id)` and
  `collection_ids: formValues.collections.map((c) => c.id)` in the `RequestStore.mutate` body
  (`#performCreate`).
- Update specs: `StlModelNewModalSpec.js`/`StlModelNewControllerSpec.js` cover picking
  sources/collections and submitting with the right `source_ids`/`collection_ids` (including the
  empty-array default when none picked).

### Step 7 — Show `StlModel.collections` on the detail page

- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx`: add
  `#renderCollections(collections)`, mirroring `#renderSources` exactly (same list markup,
  `stl_model_page.collections` heading key), called in the right column right under
  `#renderSources(stlModel.sources)`.
- Update `StlModelHelperSpec.js`: renders the collections list when present, renders nothing when
  empty/absent (mirroring the existing `#renderSources` test cases).

## Files to Change

- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — new `renderMiniaturesNavLinks`
- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — use the new dropdown
- `frontend/assets/js/utils/ui/Icons.js` — add `close` icon
- `frontend/assets/js/components/common/badges/RemovableBadge.jsx` — new
- `frontend/assets/js/components/common/forms/TagsField.jsx` — removable tag badges
- `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx` — new
- `frontend/assets/js/components/common/forms/SingleResourcePickerField.jsx` — new
- `frontend/assets/js/components/common/forms/MultiResourcePickerField.jsx` — new
- `frontend/assets/js/components/resources/collection/pages/elements/CollectionNewModal.jsx` — source state
- `frontend/assets/js/components/resources/collection/pages/elements/helpers/CollectionNewModalHelper.jsx` — source picker UI
- `frontend/assets/js/components/resources/collection/pages/controllers/CollectionNewController.js` — send `source_id`
- `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelNewModal.jsx` — sources/collections state + remove-tag handler
- `frontend/assets/js/components/resources/stl_model/pages/elements/helpers/StlModelNewModalHelper.jsx` — pickers UI, tag-remove wiring
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js` — send `source_ids`/`collection_ids`
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx` — `#renderCollections`
- corresponding `frontend/specs/...` files mirroring every path above

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Do not add or edit any `.yaml` i18n file — that's `translator`'s scope per
  `.claude/agents/translator.md`; only add `Translator.t('...')` call sites using the exact keys
  listed under "Shared contracts" above.
- `SingleResourcePickerField`'s "click badge to re-open search" behavior has no separate explicit
  "clear to none" affordance (per the issue discussion) — re-picking is the only way to change or
  effectively clear a selection today; flag if a future issue wants a dedicated clear button.
