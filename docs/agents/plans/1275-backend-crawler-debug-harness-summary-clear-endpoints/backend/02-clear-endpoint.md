# Clear endpoint + DELETE delegation

Add `DELETE /staff/crawler.json` — staff/superuser only, deletes every row in
`CrawlerDebugEmission` (blanket clear, not scoped by `type`/`source`), returns
`204`. Mirror `staff_cache_clear` for the standalone view.

## Standalone view + shared helper

New module `backend/staff/views/staff_crawler_clear.py` holding both:

```python
from ..models import CrawlerDebugEmission


def clear_crawler_emissions():
    """Delete every recorded crawler debug emission (blanket clear)."""
    CrawlerDebugEmission.objects.all().delete()
```

...and the decorated view `staff_crawler_clear`, identical in shape to
`staff_cache_clear` (`@restricted` / `@api_view(['DELETE'])` /
`@permission_classes([AllowAny])`, same `AllowAny` comment):

```python
    error_response = require_staff(request)
    if error_response:
        return error_response

    clear_crawler_emissions()
    return Response(status=204)
```

## DELETE delegation from `staff_crawler`

Django resolves one view per URL string, so a second `path('staff/crawler.json', ...)`
would be dead — do **not** add one. Instead, in `backend/staff/views/staff_crawler.py`:

- Extend the decorator to `@api_view(['GET', 'POST', 'DELETE'])`.
- Import `clear_crawler_emissions` from `.staff_crawler_clear`.
- Add a `DELETE` branch to the dispatch (the top-of-view `require_staff` guard
  already covers auth, so the branch stays a one-liner pair):

```python
    if request.method == 'POST':
        return _create(request)
    if request.method == 'DELETE':
        clear_crawler_emissions()
        return Response(status=204)
    return _list(request)
```

## Wiring

- Re-export `staff_crawler_clear` from `backend/staff/views/__init__.py` (import
  line + `__all__` entry, next to `staff_crawler` / `staff_crawler_summary`).
  `clear_crawler_emissions` is an internal helper — no need to add it to `__all__`.
- No change to `backend/staff/urls.py` for the clear (the existing
  `staff/crawler.json` route already reaches `staff_crawler`).

## Files to Change

- `backend/staff/views/staff_crawler_clear.py` — new: `clear_crawler_emissions()`
  helper + `staff_crawler_clear` view mirroring `staff_cache_clear`.
- `backend/staff/views/staff_crawler.py` — add `DELETE` to `@api_view`, import
  and call `clear_crawler_emissions()` in a new `DELETE` dispatch branch.
- `backend/staff/views/__init__.py` — import + `__all__` entry for `staff_crawler_clear`.
