# Backend Plan: Add filters to /#/miniatures/stl_models

Main plan: [plan.md](plan.md)

## Shared contracts

Must accept the eight query params on `GET /miniatures/stl_models.json` documented in [plan.md](plan.md)'s "Shared contracts" table, AND'd together, with `race`/`roles`/`source`/`collection`/`tags` read as repeated params via `request.query_params.getlist(...)` (same convention already used by `parse_role_booleans` in `backend/games/views/common.py`).

## Implementation Steps

### Step 1 — Add a private filter-helpers module

Create `backend/miniatures/views/_stl_model_filters.py`, mirroring the shape of `backend/games/views/games/_treasure_filters.py`: one small function per filter, each taking `(request, queryset)` and returning the filtered queryset unchanged when the param is absent.

- `filter_by_name(request, queryset)` — delegate to `common.query_filters.filter_by_name(request, queryset)` (already does case-insensitive `icontains` on `name`, same as `treasures_list`'s usage).
- `filter_by_type(request, queryset)` — `request.query_params.get('type')`; if it's a member of `StlModel.TYPE_CHOICES`, `queryset.filter(type=value)`; otherwise return `queryset` unchanged (ignore, no 400 — same convention as `treasures_list`'s `_filter_by_game_type`).
- `filter_by_size(request, queryset)` — same shape as `filter_by_type`, against `StlModel.SIZE_CHOICES` and the `size` field.
- `filter_by_race(request, queryset)` — `values = request.query_params.getlist('race')`; if empty return `queryset` unchanged; otherwise `queryset.filter(races__creature__in=values)`.
- `filter_by_roles(request, queryset)` — same shape, `roles__role__in` against `getlist('roles')`.
- `filter_by_source(request, queryset)` — `values = request.query_params.getlist('source')`; filter `sources__id__in=values` (cast each to `int`, skipping/ignoring non-numeric entries the same way `_filter_by_value` in `_treasure_filters.py` swallows a bad `int()`).
- `filter_by_collection(request, queryset)` — same shape as `filter_by_source`, against `collections__id__in`.
- `filter_by_tags(request, queryset)` — `values = request.query_params.getlist('tags')`; filter `tags__name__in=values`.

Keep each function single-purpose and named after its param, matching the existing `_treasure_filters.py` style (module-private, imported individually rather than as a class).

### Step 2 — Wire the filters into `stl_models_list`

Edit `backend/miniatures/views/stl_models_list.py`:

- Import the eight helpers from `._stl_model_filters`.
- Replace `page, headers = Paginator(request, StlModel.objects.all()).paginate()` with a queryset built by chaining every filter over `StlModel.objects.all()`, then `.distinct()` (needed because `race`/`roles`/`source`/`collection`/`tags` each traverse an M2M/reverse-FK join that can multiply rows), then pass that into `Paginator(...).paginate()` as today.
- Leave the `POST` branch (`_create_stl_model`) untouched.

### Step 3 — Tests

Extend `backend/miniatures/tests/views/stl_models_list_test.py`:
- One test per filter param in isolation (`name` partial/case-insensitive match, `type` exact match plus an unrecognized-value-is-ignored case, `race`/`roles` each with one and with multiple values, `source`/`collection` each with one and multiple ids, `tags` with one and multiple names, `size` exact match plus unrecognized-value-ignored).
- At least one combination test asserting AND semantics across two or more simultaneous filters.
- A duplicate-row regression test: an `StlModel` with two matching `races` entries for a `race` filter with two values must still appear exactly once in the response (`.distinct()` coverage).
- Confirm existing unfiltered-list behavior (no query params) is unchanged.

## Files to Change

- `backend/miniatures/views/_stl_model_filters.py` — new, one filter function per query param.
- `backend/miniatures/views/stl_models_list.py` — chain the new filters (plus `.distinct()`) into the `GET` branch's queryset.
- `backend/miniatures/tests/views/stl_models_list_test.py` — new coverage for every filter param, individually and combined.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- `StlModelListSerializer` (`id`, `name`, `photo_url`) is unchanged — filtering happens on the queryset before serialization, so no new fields are exposed and no data-access/security review is expected to flag anything here. Still worth a quick pass given the new query-param surface, per this repo's usual `security`/`data-access` read-only review during implementation.
- `stl_models_list` remains `IsAuthenticated`-only and does not call `skip_cache()` on the `GET` branch today (only the `POST` create path does) — that's existing behavior, not something this issue changes.
