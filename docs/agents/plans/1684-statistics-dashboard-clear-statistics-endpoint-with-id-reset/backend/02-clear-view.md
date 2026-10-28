# The clear view, route and audit log

Create `backend/staff/views/staff_statistics_clear.py`:

- `logger = logging.getLogger(__name__)`, so the line goes to the `staff` logger.
- `log_statistics_clear(status, staff_id, deleted_visits, deleted_sessions, duration_ms, error=None)`:
  - On success it logs at INFO:
    `'staff_statistics_clear status=%s staff_id=%s deleted_visits=%s deleted_sessions=%s duration_ms=%s'`.
  - On failure it logs at WARNING with the same fields plus ` error=%s`.
  - It never logs the IP, username, email or exception message.
- The view `staff_statistics_clear(request)`:
  - Decorators in the same order as `staff_cache_clear`: `@restricted`,
    `@api_view(['DELETE'])`, `@permission_classes([AllowAny])` (with the same comment), and
    `require_staff(request)` inline.
  - Body: build `reset = StatisticsReset()` and take `time.monotonic()`. In a `try`, call
    `reset.run()`. In `except Exception as exc`, log `failed` with `reset.deleted_*`,
    `duration_ms` and `type(exc).__name__`, then `raise`, so DRF or Django returns `500` and
    nothing is rolled back. On success, log `success` and return
    `Response({'deleted_visits': reset.deleted_visits, 'deleted_sessions': reset.deleted_sessions})`
    with status `200`.
  - `duration_ms` is `int((time.monotonic() - start) * 1000)`.

Export the view from `backend/staff/views/__init__.py` (both the import and `__all__`, in
alphabetical order). Add the route in `backend/staff/urls.py` next to the
`staff/statistics/*.json` routes:
`path('staff/statistics.json', views.staff_statistics_clear, name='staff-statistics-clear')`.

## Files to Change

- `backend/staff/views/staff_statistics_clear.py`: new; holds the view and
  `log_statistics_clear`.
- `backend/staff/views/__init__.py`: export `staff_statistics_clear`.
- `backend/staff/urls.py`: add the `DELETE staff/statistics.json` route.
