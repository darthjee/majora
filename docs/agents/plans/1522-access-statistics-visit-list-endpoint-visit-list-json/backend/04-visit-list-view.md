# Add the visit-list.json view and URL

Add `staff_statistics_visit_list` in `backend/staff/views/staff_statistics_visit_list.py`, mirroring `staff_statistics_users`:

```python
@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff ...
@permission_classes([AllowAny])
def staff_statistics_visit_list(request):
    error_response = require_staff(request)
    if error_response:
        return error_response
    sort, sort_errors = parse_sort(request, VisitList.SORT_KEYS, VisitList.DEFAULT_SORT)
    filters, error_response = parse_statistics_filters(request, sort_errors)
    if error_response:
        return error_response
    return paginated_list_response(
        request, VisitList(filters, sort).queryset(), StaffStatisticsVisitSerializer,
        context={'now': timezone.now()},
    )
```

Register `path('staff/statistics/visit-list.json', views.staff_statistics_visit_list, name='staff-statistics-visit-list')` in `backend/staff/urls.py` after `users.json`, and export the view from `backend/staff/views/__init__.py`.

Tests in `backend/staff/tests/staff_statistics_visit_list_test.py`, following the class layout of `staff_statistics_users_test.py` (`_…ViewSetup`, Access / Response / Pagination / Sort / Filters / Edge cases classes):
- **Access:** 401 for anonymous callers; 403 for non-staff and DMs; 403 for non-staff even with an invalid `sort` (the staff check comes first); 200 for staff and superusers; `X-Skip-Cache: true`; the URL name resolves.
- **Response:** a plain JSON array with the exact row keys; `user` identity keys; `user: null` for anonymous and deleted-user sessions; the unknown domain entry; `ongoing` with `timezone.now` patched; no `token` value anywhere in the response body; a fixed query count that does not grow with the number of rows (`CaptureQueriesContext`: count + page).
- **Pagination:** `page` / `pages` / `per_page` / `total` headers; order kept across pages; a page past the last one gives `[]` with headers; `invalid_page` / `invalid_per_page` → 400.
- **Sort:** each key descending with the `-id` tie-break; the default is `started_at`; an unknown or empty `sort` → 400 `invalid_sort`; a bad `sort` together with a bad `tz` reports both keys.
- **Filters / edge cases:** `audience` (`anonymous` includes deleted users, `logged_in`, `all`); `user`, plus an unknown user id → `[]`; `domain`, plus `unknown`; `granularity` accepted, an invalid one → 400; visits started before `from` excluded; single-hit visit with duration `0`; login boundary (an anonymous visit followed by a logged-in visit on another session shows as two rows: one anonymous, one with the user).

## Files to Change
- `backend/staff/views/staff_statistics_visit_list.py` (new): the view.
- `backend/staff/views/__init__.py`: export the view.
- `backend/staff/urls.py`: the `staff-statistics-visit-list` route.
- `backend/staff/tests/staff_statistics_visit_list_test.py` (new): endpoint tests.
