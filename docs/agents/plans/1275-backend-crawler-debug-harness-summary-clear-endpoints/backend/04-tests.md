# Tests

Cover both endpoints and the builder class, following the existing
`backend/staff/tests/` conventions (see `staff_cache_summary_test.py`,
`staff_cache_clear_test.py`, `staff_crawler_test.py`).

## New: `backend/staff/tests/staff_crawler_summary_test.py`

`TestStaffCrawlerSummaryView` — mirror `TestStaffCacheSummaryView`:

- `setup_method`: build `staff_user` (`UserFactory(is_staff=True)`), `superuser`
  (`SuperUserFactory()`), `regular_user` (`UserFactory()`), each with a `Token`.
  No cache priming needed.
- `_get(client, token=None)` helper hitting `/staff/crawler/summary.json`, adding
  `HTTP_AUTHORIZATION=f'Token {token.key}'` when a token is given.
- Tests:
  - `test_unauthenticated_returns_401`
  - `test_non_staff_non_superuser_returns_403`
  - `test_staff_user_can_read_the_summary` — create emissions of mixed `type`
    (e.g. 2 × `stl_model`, 1 × `collection`) and mixed `source`; assert
    `response.status_code == 200` and `response.data == {'stl_model': 2, 'collection': 1}`.
  - `test_superuser_can_read_the_summary` — same, via `superuser_token`.
  - `test_empty_table_returns_empty_dict` — no rows; assert `response.data == {}`.
  - `test_grouping_ignores_source` — same `type`, different `source`, assert the
    two collapse into one count (guards against the `.order_by()` /
    default-ordering GROUP BY bug).
  - `test_response_includes_skip_cache_header` — `response['X-Skip-Cache'] == 'true'`.
  - `test_url_by_name` — `reverse('staff-crawler-summary')`.
- Build rows directly: `CrawlerDebugEmission.objects.create(source='a', type='stl_model', payload={})`.

## Optional: `backend/staff/tests/crawler_debug_emission_summary_test.py`

`TestCrawlerDebugEmissionSummary` (mirrors `crawler_debug_emission_paginator_test.py`)
— class-level unit tests for `CrawlerDebugEmissionSummary().as_dict()`: correct
per-`type` grouping, empty table → `{}`, `source` does not affect grouping. Keep
this if it adds coverage beyond the view test; otherwise the view test suffices.

## Extend: `backend/staff/tests/staff_crawler_test.py`

Add to `TestStaffCrawlerView`:

- `_delete(client, token=None)` helper hitting `/staff/crawler.json`.
- `test_delete_unauthenticated_returns_401`
- `test_delete_non_staff_returns_403`
- `test_staff_user_can_clear_the_table` — create several emissions, `_delete`
  with `staff_token`, assert `response.status_code == 204` and
  `CrawlerDebugEmission.objects.count() == 0`.
- `test_superuser_can_clear_the_table` — same via `superuser_token`.
- `test_clear_does_not_affect_other_tables` — create a `CrawlerDebugEmission`
  row and an unrelated row (e.g. a `User` via `UserFactory()`), `_delete`, assert
  the emission table is empty but the other model's rows survive.
- `test_delete_response_includes_skip_cache_header` — `response['X-Skip-Cache'] == 'true'`.

## Files to Change

- `backend/staff/tests/staff_crawler_summary_test.py` — new: `TestStaffCrawlerSummaryView`.
- `backend/staff/tests/crawler_debug_emission_summary_test.py` — new, optional:
  builder-class unit tests.
- `backend/staff/tests/staff_crawler_test.py` — add `_delete` helper + `DELETE`
  access/behavior/header tests.
