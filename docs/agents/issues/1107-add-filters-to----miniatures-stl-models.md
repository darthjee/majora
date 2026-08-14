# Add filters to /#/miniatures/stl_models

## Context

The `/#/miniatures/stl_models` list page currently has no filtering at all — its list-type config (`stlModelListType.js`) sets `filtersComponent: null`, and the backend `stl_models_list` view does no query-param filtering whatsoever. This was originally scoped as part of issue #820 ("Improve miniature/stl_model"), but was split off into this separate issue since it depends on #820's groundwork (`race`/`role` becoming arrays, the new `url`/`size` fields, and the generalized constant-search picker component) and is substantial enough to track independently.

**Depends on #820** — the race/role array conversion and the generalized picker component it introduces are prerequisites for this issue's race/roles filter.

## What needs to be done

**Backend** (`backend/miniatures/views/stl_models_list.py` and related serializers):
- Add query-param filtering to the `stl_models_list` view:
  - `name` — free-text, case-insensitive partial match
  - `type` — exact match against `TYPE_CHOICES`
  - `race` — matches stl_models having at least one of the given race(s) (multi-value)
  - `roles` — matches stl_models having at least one of the given role(s) (multi-value)
  - `source` — matches stl_models linked to the given source id(s)
  - `collection` — matches stl_models linked to the given collection id(s)
  - `tags` — matches stl_models having at least one of the given tag name(s)
  - `size` — exact match against `SIZE_CHOICES`
- Filters combine with AND semantics across fields.

**Frontend** (`frontend/assets/js/components/resources/stl_model/`, `frontend/assets/js/components/common/list_types/configs/stlModelListType.js`):
- Add a `filtersComponent` to `stlModelListType.js`, following the `NpcFilters`/`TreasureFilters` pattern (own Controller/Helper, reading initial values from `HashRouteResolver().getFilterParams()`, calling `onQuery`/`onClear`):
  - `name` — free text input
  - `type` — dropdown (`EnumSelectField`)
  - `race` — constant-set search picker (reusing/generalizing the picker component built in #820 for the race/role fields), multi-select
  - `roles` — same picker pattern, multi-select
  - `source` — resource search (`MultiResourcePickerField`/`ResourcePickerSearch`, same as stl_model creation)
  - `collection` — resource search, same pattern
  - `tags` — free-type add-to-list (`TagsField`, same as stl_model creation)
  - `size` — dropdown (`EnumSelectField`)

## Acceptance criteria

- [ ] `stl_models_list` accepts and applies `name`/`type`/`race`/`roles`/`source`/`collection`/`tags`/`size` query params, combined with AND semantics
- [ ] `/#/miniatures/stl_models` renders a filters bar with the field/widget pairing described above
- [ ] Filtering round-trips through the URL hash (consistent with `NpcFilters`/`TreasureFilters`), so a filtered view is shareable/bookmarkable
- [ ] Backend tests cover each filter param individually and in combination
- [ ] Frontend tests cover the new filters component's rendering and query/clear behavior
