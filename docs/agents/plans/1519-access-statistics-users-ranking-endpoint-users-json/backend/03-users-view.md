# users.json view, URL and tests

Add `backend/staff/views/staff_statistics_users.py` with `staff_statistics_users`, mirroring
`staff_statistics_duration.py`:

```python
@restricted
@api_view(['GET'])
# AllowAny: authentication/authorisation is enforced inline via require_staff so
# unauthenticated or non-staff callers receive a proper 401/403.
@permission_classes([AllowAny])
def staff_statistics_users(request):
    """Return the paginated ranking of logged-in users by visit metrics."""
    error_response = require_staff(request)
    if error_response:
        return error_response
    sort, sort_errors = parse_sort(request, UsersRanking.SORT_KEYS, UsersRanking.DEFAULT_SORT)
    filters, error_response = parse_statistics_filters(request, sort_errors)
    if error_response:
        return error_response
    page, headers = Paginator(request, UsersRanking(filters, sort).build()).paginate()
    return Response(<page rows merged with identities>, headers=headers)
```

## Identity merge
- Run one `User.objects.select_related('profile').filter(id__in=[row['id'] for row in page])`
  query, and skip it when the page is empty.
- Build `{id, name: username, display_name, email}` per user. `display_name` is `None` when the
  profile is missing or its `display_name` is blank. Catch `User.profile.RelatedObjectDoesNotExist`
  / `ObjectDoesNotExist`, or use `getattr` with a fallback.
- Put the identity keys first and the metric keys after (key order as in the spec example).
- Keep this as a small private helper in the view module, or a tiny class if it grows. The view
  must stay thin.

## Wiring
- Register `staff/statistics/users.json` → `views.staff_statistics_users`, name
  `staff-statistics-users`, in `backend/staff/urls.py` after `duration.json`.
- Export the view from `backend/staff/views/__init__.py` (import and `__all__`).

## Tests (in `backend/staff/tests/staff_statistics_users_test.py`)
Follow the setup of `staff_statistics_duration_test.py`.
- Access: 401 anonymous, 403 for a regular user and for a DM, 200 for staff and for a superuser,
  and the `X-Skip-Cache: true` header.
- Reversing `staff-statistics-users` gives the URL.
- Response: a plain list, each row with exactly `id`, `name`, `display_name`, `email`, `visits`,
  `time_on_site_seconds`, `average_duration_seconds`, `hits`, `domains`, `last_seen_at`, and the
  `page` / `pages` / `per_page` / `total` headers.
- `display_name` is `null` when the profile is blank or missing.
- Pagination: `per_page=1` across pages keeps the sort order stable with ties. A page past the last
  one returns `[]` with headers.
- Sorting: each `sort` key works. `sort=bogus` and `sort=` return 400 with `invalid_sort`.
  `sort=bogus&tz=Nowhere` returns both errors. A bad `page` or `per_page` returns 400.
- Filters: `audience=anonymous` returns `[]` with `total: 0`. `audience=logged_in` returns the same
  rows as the default. `user=<id>` returns one row, and an unknown user returns `[]`. The `domain`
  filter and `domain=unknown` restrict rows and their `domains`. `granularity` is accepted.
- An anonymous-session visit never shows up.
- Query count stays constant for a page of users (`django_assert_num_queries`, or
  `CaptureQueriesContext`): one visit query, one user query, plus the auth queries.

## Files to Change
- `backend/staff/views/staff_statistics_users.py` — new view.
- `backend/staff/views/__init__.py` — export the view.
- `backend/staff/urls.py` — route `staff-statistics-users`.
- `backend/staff/tests/staff_statistics_users_test.py` — new tests.
