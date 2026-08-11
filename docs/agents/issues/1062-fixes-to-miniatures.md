# Issue: Fixes to miniatures

## Description

Four related fixes/additions to the miniatures feature (STL models, sources, collections):

1. Group the 3 miniatures nav links (STL models, sources, collections) under one "Miniatures"
   dropdown in the header instead of 3 separate top-level links.
2. Introduce a generic, reusable resource-picker (search-and-pick) component, backed by
   `RequestStore` (resource-based, not URL-based) and a newly shared, cross-app `name`-search
   query filter, mirroring the existing PC/NPC character search pattern.
3. Let a `Collection` be created with an optional `Source` attached (the model already supports
   this — it just isn't accepted on create yet).
4. Let a `StlModel` be created with `Source`s and `Collection`s attached (via the picker), fix
   tag removal in the STL model creation form, and expose `StlModel.collections` end-to-end
   (currently only `sources` is exposed; `collections` is a model-level relation with no
   serializer/UI support at all yet).

## Problem

- The header lists STL models, sources, and collections as 3 separate top-level nav links instead
  of one grouped dropdown.
- `Collection.source` is already a single, optional `ForeignKey` on the model, but
  `CollectionCreateSerializer` explicitly rejects `source` on create — there is no update/edit
  endpoint either, so a collection's source can currently never be set at all.
- The STL model creation form's tags can be added but not removed before submit — there's no
  "x"/remove affordance on the tag badges, and no removable-badge component exists yet.
- `StlModel.sources` is a model-level M2M with no way to populate it from the creation form
  (`StlModelCreateSerializer` explicitly rejects `sources` on create, same as collections' source).
- `StlModel.collections` is a model-level M2M that isn't exposed *anywhere* yet — no create field,
  no detail-serializer field, no UI rendering on the show page.
- `sources.json`/`collections.json` have no `name` query param, so there is no way to search them
  server-side (needed by the picker component below) — every other similar "browse and filter by
  name" endpoint in the codebase (e.g. a game's PC/NPC list) already supports this.

## Solution

### 1. Header: "Miniatures" nav dropdown

The 3 nav items are currently all gated by the same single check (`state.loggedIn`), so the new
"Miniatures" dropdown gets one flat `state.loggedIn` gate too — mirroring the existing
`renderAdminNavLinks` pattern in `HeaderNavHelper.jsx` (single-check dropdown, not per-item
conditionals). Add `HeaderNavHelper.renderMiniaturesNavLinks(state)`:

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

Called from `HeaderHelper.render` alongside the other `renderXNavLinks(state)` calls, replacing the
3 standalone `Nav.Link`s. Needs a new `header.nav_miniatures` translation key (all locales); the
existing `nav_stl_models`/`nav_sources`/`nav_collections` keys are reused as-is.

Also confirmed (no change needed): creating a source/collection/STL model is already
staff-or-superuser-only, both backend (`require_staff` on the 3 create endpoints, checking
`AdminOrStaffCache.is_admin_or_staff`) and frontend (`useStaffOrSuperUser()` gates the "New"
button on `StlModels.jsx`/`Sources.jsx`/`Collections.jsx`, and each `*NewController` re-checks via
`AccessStore.ensureStaffOrSuperUser()` before submit).

### 2. Shared: resource picker component

One generic, reusable picker built as 3 components under `common/forms/` (alongside
`FormField.jsx`/`TagsField.jsx`), split the same way `TagsField` is: dumb, controlled inputs.

1. **`ResourcePickerSearch.jsx`** — the shared core, not used directly in a form. Owns the text
   input + a 300ms debounce (mirroring `GiveItemModal`'s `SEARCH_DEBOUNCE_MS`) + the results list
   (image + name rows). Props: `resource` (string, e.g. `'source'`/`'collection'`), `maxEntries`
   (number; callers start with `4`), `onSelect(item)`. Fetches via `RequestStore` — **not** a raw
   URL — exactly like `GiveItemModalController.fetchCharacterPage`:
   ```js
   RequestStore.ensure({
     componentName, resource, quantityType: 'collection',
     query: { per_page: maxEntries, name: searchTerm },
   })
   ```
   `RequestStore` + the existing `sourceConfig.js`/`collectionConfig.js` (`GET.collection`) resolve
   the actual URL/permissions, matching how `pc`/`npc` character search already works — this is the
   established "standardize query" pattern (nothing new to build backend-URL-wise beyond the
   `name` filter itself, see below).

2. **`SingleResourcePickerField.jsx`** — wraps the core; controlled (`value`, `onChange(item|null)`).
   Once a source is picked, the search UI is replaced by the selected item shown as a badge/pill;
   clicking that pill re-opens the search so a different one can be picked (replacing the value).
   Used for Collection's `source_id`.

3. **`MultiResourcePickerField.jsx`** — wraps the core; controlled (`value: []`, `onChange(newArray)`).
   Search stays open/usable at all times; picking a result appends it (deduped by id) to the
   selection, rendered as `RemovableBadge`s (see the tags-removal item below — one shared
   removable-badge primitive backs both features rather than two bespoke markups). Used for
   StlModel's `sources` and `collections` fields.

Each backend list endpoint (`sources.json`, `collections.json`) needs a `name`-search query param
to support this — see below.

### 3. Shared: name-search query filter

The `name`-substring-search behavior already exists twice in `games` --
`games/views/games/_treasure_filters.py::filter_by_name(request, queryset, field='name')` and
`games/views/game/_shared.py::_filter_by_character_name(request, queryset)` -- both doing the
exact same `queryset.filter(<field>__icontains=name)` off a `name` query param, no-op when
blank/absent, just copy-pasted rather than shared. Rather than add a 3rd copy for `miniatures`,
extract it once into a new small top-level app, following the precedent already set by
`permissions` (a no-model, cross-cutting app in `INSTALLED_APPS` that `games`/`miniatures`/others
already import a single shared helper from, e.g. `from permissions import EndpointPermission`):

- New app **`backend/common/`**, added to `INSTALLED_APPS` (after `permissions`), containing
  `common/query_filters.py`:
  ```python
  def filter_by_name(request, queryset, field='name'):
      """Filter queryset to a case-insensitive substring match on `<field>` from the `name` query param."""
      name = request.query_params.get('name')
      if not name:
          return queryset
      return queryset.filter(**{f'{field}__icontains': name})
  ```
- Refactor the two existing `games` copies to delegate to it (removing the duplication for real,
  not just avoiding a 3rd copy):
  - `games/views/games/_treasure_filters.py::filter_by_name` becomes a thin call-through to
    `common.query_filters.filter_by_name` (or is dropped in favor of callers importing the shared
    one directly).
  - `games/views/game/_shared.py::_filter_by_character_name` becomes a thin, character-named
    wrapper around it (kept, since it's referenced by name in several call sites already).
- `miniatures/views/sources_list.py` and `miniatures/views/collections_list.py` import
  `common.query_filters.filter_by_name` directly and apply it to the queryset before pagination.

### 4. Collections: optional `source`

`Collection.source` is already a single, nullable `ForeignKey`
(`on_delete=SET_NULL, null=True, blank=True`) -- one optional source per collection, not many.
`CollectionDetailSerializer` already exposes it read-only as a nested `{id, name}`. No model
change needed.

`CollectionCreateSerializer` currently *rejects* `source` on create by design -- its docstring
already anticipates this exact feature ("assigned later via a separate, not-yet-built feature").
There's no update/edit serializer for `Collection` at all yet, so creation time is the only place
`source` can be set. Add a `source_id` field to `CollectionCreateSerializer`:
`source_id = serializers.PrimaryKeyRelatedField(source='source', queryset=Source.objects.all(), required=False, allow_null=True)`
so `POST /miniatures/collections.json` accepts `{"source_id": 3}`.

The collection creation form gets a `SingleResourcePickerField` (`resource="source"`,
`maxEntries={4}`) so the user can search sources by name and pick one, which sets `source_id` on
submit.

### 5. STL models: tag removal

No removable-badge primitive exists yet (`Badge.jsx` is read-only; no `x`/close icon in
`Icons.js`; no shared `common.yaml` i18n key for "remove" — every page owns its own scoped key,
e.g. `remove_character_tooltip`). Build one shared primitive, reused by both this fix and the
`MultiResourcePickerField` selection badges above:

1. `Icons.js` — add `close: 'bi-x-lg'`.
2. `common/badges/RemovableBadge.jsx` (new, sibling of `Badge.jsx`) — same `text`/`icon`/
   `variant` props as `Badge`, plus `onRemove` and a caller-supplied translated `removeLabel`
   (mirrors `Badge`'s no-built-in-i18n design):
   ```jsx
   <span className={`badge bg-${variant} d-inline-flex align-items-center gap-1`}>
     {icon && <i className={`bi ${icon}`} aria-hidden="true"></i>}
     {text}
     <button type="button" className="btn btn-link p-0 text-white" aria-label={removeLabel} onClick={onRemove}>
       <i className={`bi ${Icons.close}`} aria-hidden="true"></i>
     </button>
   </span>
   ```
3. `TagsField.jsx` — swap `Badge` for `RemovableBadge`; add an `onRemoveTag(tag)` prop wired to
   each badge's `onRemove`.
4. `StlModelNewModal.jsx` — add `handleRemoveTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag))`,
   threaded through `StlModelNewModalHelper` as `onRemoveTag`.
5. New i18n key `stl_model_new_page.remove_tag_tooltip` ("Remove tag"), passed as `removeLabel`.

### 6. STL models: source selector

`StlModelCreateSerializer` has the same anticipating docstring as `CollectionCreateSerializer`
did: "`sources` is out of scope on creation (see the issue): new `StlModel`s are always created
with an empty `sources` list, attached later via a separate feature." Mirrors the
`Collection.source_id` decision:

- Add `source_ids = serializers.PrimaryKeyRelatedField(source='sources', queryset=Source.objects.all(), many=True, required=False, default=list)`
  to `StlModelCreateSerializer`. In `create()`, after `StlModel.objects.create(**validated_data)`,
  call `stl_model.sources.set(sources)` — one bulk `.set()`, not a per-entry loop like `TagsSync`
  (sources already exist; no get-or-create needed), so no `MAX_TAGS`-style count cap is added —
  `PrimaryKeyRelatedField` already bounds each entry to an existing row via one query.
- Frontend: `StlModelNewModal.jsx` gets a `sources` array + `setSources` state, rendering
  `<MultiResourcePickerField resource="source" maxEntries={4} value={sources} onChange={setSources} />`
  in the right column, stacked under the tags field (collections, below, stack under that).
  Submit body adds `source_ids: sources.map((s) => s.id)`.

### 7. STL models: collection selector (and exposing `StlModel.collections`)

Unlike `sources`, `StlModel.collections` (the M2M already on the model) is not exposed anywhere
yet -- no field on `StlModelCreateSerializer` or `StlModelDetailSerializer`, and no
`#renderCollections` counterpart to `StlModelHelper.jsx`'s existing `#renderSources`. Mirror the
source pattern end-to-end, including detail-page display (otherwise a collection linked at
creation would be invisible on the show page after this issue ships):

- **Backend:**
  - `StlModelCreateSerializer`: add
    `collection_ids = serializers.PrimaryKeyRelatedField(source='collections', queryset=Collection.objects.all(), many=True, required=False, default=list)`;
    `create()` calls `stl_model.collections.set(collections)` alongside the existing
    `stl_model.sources.set(sources)`.
  - `StlModelDetailSerializer`: add `collections = CollectionSerializer(many=True, read_only=True)`,
    backed by a new `name`-only nested serializer mirroring the existing `SourceSerializer`
    (`fields = ['name']`).
- **Frontend:**
  - `StlModelNewModal.jsx`: `collections` array + `setCollections` state, rendering
    `<MultiResourcePickerField resource="collection" maxEntries={4} value={collections} onChange={setCollections} />`
    stacked under the source picker in the right column. Submit body adds
    `collection_ids: collections.map((c) => c.id)`.
  - `StlModelHelper.jsx`: add `#renderCollections(collections)`, mirroring `#renderSources`
    exactly, rendered in the right column under `#renderSources`. New i18n key
    `stl_model_page.collections`.

Both `sources.json` and `collections.json` need the shared `name`-search filter (item 3 above)
applied before pagination for the picker component to work against them.

## Benefits

- Cleaner, grouped header navigation for the miniatures feature.
- A reusable resource-picker component (search + single/multi pick) that future features can drop
  in against any resource, not just sources/collections.
- Removes duplicated `name`-search filtering logic across `games` and `miniatures`, via one shared
  `common` app.
- Collections and STL models can be fully linked to their source/collections at creation time, and
  `StlModel.collections` — previously invisible everywhere — becomes visible end-to-end.
- Fixes a real usability bug (tags that can't be removed before submitting the STL model form).
