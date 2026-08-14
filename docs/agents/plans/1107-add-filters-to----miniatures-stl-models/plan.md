# Plan: Add filters to /#/miniatures/stl_models

Issue: [1107-add-filters-to----miniatures-stl-models.md](../issues/1107-add-filters-to----miniatures-stl-models.md)

## Overview

Add a filters bar to `/#/miniatures/stl_models`, following the existing `NpcFilters`/`TreasureFilters` pattern, and add matching query-param filtering to the `stl_models_list` backend view. Filters combine with AND semantics across fields; the five multi-value fields (`race`, `roles`, `source`, `collection`, `tags`) match on any one of their given values (OR within field) and are passed as repeated query params (Django's `QueryDict.getlist()` convention, e.g. `?race=elf&race=orc`) — no existing filters bar has needed multi-value fields before, so the shared hash/query-string plumbing needs extending alongside the new filters bar itself.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

**Query params accepted by `GET /miniatures/stl_models.json` (`stl_models_list`)**, all optional, AND'd together:

| Param | Type | Semantics |
|---|---|---|
| `name` | scalar string | case-insensitive substring match on `StlModel.name` |
| `type` | scalar string | exact match against `StlModel.TYPE_CHOICES`; ignored if not a recognized choice |
| `race` | repeated string | `StlModel`s with at least one `StlModelRace.creature` in the given set (`races__creature__in`) |
| `roles` | repeated string | `StlModel`s with at least one `StlModelRole.role` in the given set (`roles__role__in`) |
| `source` | repeated int | `StlModel`s linked to at least one of the given `Source` ids (`sources__id__in`) |
| `collection` | repeated int | `StlModel`s linked to at least one of the given `Collection` ids (`collections__id__in`) |
| `tags` | repeated string | `StlModel`s with at least one `Tag.name` in the given set (`tags__name__in`) |
| `size` | scalar string | exact match against `StlModel.SIZE_CHOICES`; ignored if not a recognized choice |

A malformed/unrecognized scalar value (`type`, `size`) is ignored (same convention as `treasures_list`'s `_filter_by_game_type`), not a 400. Any multi-value M2M filter (`race`, `roles`, `source`, `collection`, `tags`) requires `.distinct()` on the final queryset to avoid duplicate rows from the join.

**Frontend infra extension needed for multi-value fields** (none of `HashRouteResolver`, `buildFilterQuery`, or `GenericClient` support this today — every existing filters bar is scalar-only):

- `frontend/assets/js/utils/routing/HashRouteResolver.js`'s `getFilterParams()`/`FILTER_KEYS` currently collapse each key to one value via `URLSearchParams#set`. It must instead preserve every value the hash's `URLSearchParams` already holds per key (`URLSearchParams` supports repeated keys natively via `.append()`/`.getAll()` — the loss happens only in `getFilterParams()`'s own `params.set(key, value)` line).
- `frontend/assets/js/client/GenericClient.js`'s `#buildIndexParams(extraParams)` currently does `params.set(key, value)` per entry of `Object.entries(extraParams)`, which can't represent multiple values for one key. It needs an `Array.isArray(value)` branch that appends one param per array entry instead of a single `.set()`.
- Any list-type `fetchList` that reads `hashResolver.getFilterParams()` and flattens it with `Object.fromEntries(...)` (e.g. `globalTreasureListType.js`'s `fetchGlobalTreasures`) silently drops all but the last value for a repeated key — `stlModelListType.js`'s new `fetchStlModels` must build its `extraParams` array-aware instead (e.g. group `getFilterParams().entries()` by key into `string | string[]`), and existing scalar-only callers are unaffected since a single-entry group stays a scalar.

Reused rather than rebuilt: `race_<value>`/`role_<value>`/`type_<value>`/`size_<value>` translation keys and `TYPE_VALUES`/`RACE_VALUES`/`ROLE_VALUES`/`SIZE_VALUES` constant lists already exist (from #820) and are shared verbatim between the create/edit form and the new filters bar.
