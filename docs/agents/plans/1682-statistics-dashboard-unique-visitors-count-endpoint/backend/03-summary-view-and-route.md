# Summary view and route

Add the view `staff_statistics_summary` and route it.

- **Decorators:** the same as `staff_statistics_overview.py`: `@restricted`,
  `@api_view(['GET'])`, and `@permission_classes([AllowAny])` with the same comment, plus
  `require_staff(request)` inline.
- **Parsing:** `SummaryParamsParser(request.query_params).parse()`. On errors, return
  `Response({'errors': errors}, status=400)`.
- **Response (200):**

  ```json
  {"period": "week", "from": "2026-10-21", "to": "2026-10-27", "tz": "America/Sao_Paulo",
   "unique_visitors": 42}
  ```

  `from` / `to` are the filters' local dates (ISO), and `tz` is `filters.tz.key`.
- **Route:** `staff/statistics/summary.json`, name `staff-statistics-summary`, in
  `backend/staff/urls.py` next to the other `staff/statistics/*.json` routes. Export the view
  from `backend/staff/views/__init__.py`.

View tests follow `staff_statistics_overview_test.py`. They control "today" by patching the
parser's today lookup with `unittest.mock.patch` (the repo has no freezegun). They cover:

- `401` for anonymous callers, `403 {"errors": {"detail": ["not_allowed"]}}` for regular and
  DM users, and `200` for staff and superuser;
- the `X-Skip-Cache` header from `@restricted`;
- each period, with visits on the window's first and last local days and just outside it;
- logged-in and anonymous visitors;
- `tz` handling, including a DST boundary (e.g. `America/Sao_Paulo` or `Europe/London`);
- the defaults echoed (`period: day`, `tz: UTC`);
- the `400` cases: invalid `period`, invalid `tz`, and both combined;
- other params being ignored;
- an empty window returning `unique_visitors: 0`;
- the invariant: the same visits queried through `overview.json` with the returned
  `from` / `to` / `tz` give the same `totals.unique_visitors`.

## Files to Change

- `backend/staff/views/staff_statistics_summary.py` — the new view.
- `backend/staff/views/__init__.py` — import and export it.
- `backend/staff/urls.py` — add the route.
- `backend/staff/tests/staff_statistics_summary_test.py` — the view tests.
