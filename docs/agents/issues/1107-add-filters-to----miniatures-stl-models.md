# Issue: Add filters to /#/miniatures/stl_models

## Description

The `/#/miniatures/stl_models` list page currently has no filtering at all — its list-type config (`stlModelListType.js`) sets `filtersComponent: null`, and the backend `stl_models_list` view (`backend/miniatures/views/stl_models_list.py`) does no query-param filtering whatsoever; it simply paginates `StlModel.objects.all()`.

This was originally scoped as part of #820 ("Improve miniature/stl_model"), but was split off into this separate issue since it depends on #820's groundwork — `race`/`role` becoming their own many-valued `StlModelRace`/`StlModelRole` models, the new `url`/`size` fields, and `MultiResourcePickerField` (which already generalizes to both API-backed resource search and a constant-set "picker" mode via `values`/`translateOption`, as used for the `races`/`roles` fields on the stl_model create/edit form) — and is substantial enough to track independently. #820 has since shipped, so this issue's prerequisites are satisfied.

## Problem

Users browsing `/#/miniatures/stl_models` have no way to narrow the catalog by any of the fields that exist on `StlModel` — name, type, race, role, source, collection, tags, or size. Every other major resource list (`NpcFilters`, `TreasureFilters`, `PollFilters`, `StaffUsersFilters`) already has a filters bar; STL models is the only major list left without one, which makes larger catalogs hard to browse.

## Expected Behavior

- `/#/miniatures/stl_models` renders a filters bar above the list, following the `NpcFilters`/`TreasureFilters` pattern (own Controller/Helper, draft state pre-populated from the current hash, `onQuery`/`onClear`), with:
  - `name` — free text input
  - `type` — dropdown (`EnumSelectField`)
  - `race` — constant-set picker (`MultiResourcePickerField` in constant mode, same as the create/edit form), multi-select
  - `roles` — same picker pattern, multi-select
  - `source` — resource search (`MultiResourcePickerField` in API mode / `ResourcePickerSearch`), multi-select
  - `collection` — resource search, same pattern, multi-select
  - `tags` — free-type add-to-list (`TagsField`, same as stl_model creation)
  - `size` — dropdown (`EnumSelectField`)
- `stl_models_list` applies `name`/`type`/`race`/`roles`/`source`/`collection`/`tags`/`size` query params, combined with AND semantics across fields; within a multi-value field (`race`, `roles`, `source`, `collection`, `tags`), a match on any one of the given values is enough.
- Multi-value fields are passed as repeated query params (`?race=elf&race=orc`), the Django-native convention (`QueryDict.getlist`), already used elsewhere in this codebase (`parse_role_booleans`'s `getlist('role')`).
- A filtered view is shareable/bookmarkable: filters round-trip through the URL hash, consistent with `NpcFilters`/`TreasureFilters`.

## Solution

**Backend** (`backend/miniatures/views/stl_models_list.py` and related serializers):
- Add query-param filtering to the `stl_models_list` view:
  - `name` — free-text, case-insensitive partial match
  - `type` — exact match against `TYPE_CHOICES`
  - `race` — matches stl_models having at least one of the given race(s), multi-value via `request.query_params.getlist('race')` (same convention as `parse_role_booleans`'s `getlist('role')`), filtered via `races__creature`
  - `roles` — same multi-value convention, via `roles__role`
  - `source` — matches stl_models linked to the given source id(s), multi-value via `getlist('source')`
  - `collection` — matches stl_models linked to the given collection id(s), multi-value via `getlist('collection')`
  - `tags` — matches stl_models having at least one of the given tag name(s), multi-value via `getlist('tags')`
  - `size` — exact match against `SIZE_CHOICES`
- Filters combine with AND semantics across fields; call `.distinct()` on the queryset where a multi-value M2M filter could otherwise duplicate rows.

**Frontend** (`frontend/assets/js/components/resources/stl_model/`, `frontend/assets/js/components/common/list_types/configs/stlModelListType.js`):
- Add a `filtersComponent` to `stlModelListType.js` with the fields/widgets listed under Expected Behavior.
- Extend the shared filter-URL infra to preserve multiple values per key, which no existing filters bar needs today — `HashRouteResolver.getFilterParams()`/`FILTER_KEYS` currently collapse each key to a single value via `URLSearchParams#set`/`#get`, and `buildFilterQuery()` assumes one value per entry. Both need to support repeated params for `race`/`roles`/`source`/`collection`/`tags`, in addition to registering the new scalar keys (`name`, `type`, `size`) via the existing pattern.

## Benefits

- Consistent filtering UX across all major resource list pages.
- Filtered views become shareable/bookmarkable, which matters more as owned STL catalogs grow.
- Reuses existing infra (`MultiResourcePickerField`, `EnumSelectField`, `TagsField`, `buildFilterQuery`) rather than one-off widgets.
