# Summary endpoint + builder class

Add `GET /staff/crawler/summary.json` — staff/superuser only, returns entry
counts grouped by `type`, e.g. `{"stl_model": 42, "collection": 7}` (and `{}`
when the table is empty). Mirror `staff_cache_summary` for the view; put the
aggregation in a dedicated builder class per the repo's "keep views thin" /
small-methods convention.

## Builder class

`CrawlerDebugEmissionSummary` in a new module alongside the paginator:

```python
"""Per-`type` entry-count summary of the CrawlerDebugEmission debug-harness table."""

from django.db.models import Count

from .models import CrawlerDebugEmission


class CrawlerDebugEmissionSummary:
    """Builds the `{type: count}` summary of recorded crawler debug emissions."""

    def as_dict(self):
        """Return a dict mapping each distinct `type` to its row count (``{}`` when empty)."""
        rows = (
            CrawlerDebugEmission.objects
            .values('type')
            .order_by()  # drop Meta.ordering=['id'] so it isn't added to GROUP BY
            .annotate(count=Count('id'))
        )
        return {row['type']: row['count'] for row in rows}
```

## View

`staff_crawler_summary` — a thin passthrough, identical in shape to
`staff_cache_summary` (decorator order: `@restricted` outermost, then
`@api_view(['GET'])`, then `@permission_classes([AllowAny])`; inline
`require_staff` guard; keep the same `AllowAny` explanatory comment):

```python
    error_response = require_staff(request)
    if error_response:
        return error_response

    return Response(CrawlerDebugEmissionSummary().as_dict())
```

## Wiring

- Re-export `staff_crawler_summary` from `backend/staff/views/__init__.py`
  (import line next to `staff_crawler`, `__all__` entry next to `'staff_crawler'`).
- Register the route in `backend/staff/urls.py` immediately after the
  `staff/crawler.json` line, mirroring how `staff/cache/summary.json` follows
  `staff/cache.json`:
  `path('staff/crawler/summary.json', views.staff_crawler_summary, name='staff-crawler-summary')`.

## Files to Change

- `backend/staff/crawler_debug_emission_summary.py` — new: `CrawlerDebugEmissionSummary`
  builder class with `.as_dict()` running the per-`type` `Count` aggregation.
- `backend/staff/views/staff_crawler_summary.py` — new: thin `staff_crawler_summary`
  view mirroring `staff_cache_summary`, returning `CrawlerDebugEmissionSummary().as_dict()`.
- `backend/staff/views/__init__.py` — import + `__all__` entry for `staff_crawler_summary`.
- `backend/staff/urls.py` — new `staff/crawler/summary.json` route named
  `staff-crawler-summary`.
