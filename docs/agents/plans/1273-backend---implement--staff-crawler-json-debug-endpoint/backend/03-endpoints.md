# POST/GET /staff/crawler.json endpoints

`POST` and `GET` share the same URL (`staff/crawler.json`, no id segment), so — unlike
`staff_cache_clear.py`/`staff_cache_summary.py`, which live at two different paths — this
needs a single view function branching on `request.method`, following
`backend/games/views/game_sessions/session_messages_list.py`'s combined
`@api_view(['GET', 'POST'])` shape instead. Still wrap it with `@restricted` (outermost,
sets `X-Skip-Cache: true` unconditionally on every branch) + `@permission_classes([AllowAny])`
+ inline `require_staff(request)` (the `staff_cache_*` precedent) rather than
`session_messages_list`'s `EndpointPermission` check, since staff/superuser-only is a
simpler, uniform gate for both methods here — no per-method permission split needed.

`staff_crawler.py`:

```python
@restricted
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def staff_crawler(request):
    error_response = require_staff(request)
    if error_response:
        return error_response

    if request.method == 'POST':
        return _create(request)
    return _list(request)
```

`_create(request)`:
- Parse `source`, `type`, `payload` from the request body.
- `source`/`type` both required and non-empty → `400` with a clear validation error
  otherwise.
- Create the `CrawlerDebugEmission` row, then call `enforce_retention_cap` from step 02.
- Return the created record (id, `created_at`, `source`, `type`, `payload`) — a plain
  dict `Response`, no dedicated serializer needed given this model is intentionally kept
  out of the serializer layer (see step 01).

`_list(request)`:
- Read `last_id` from query params (omitted → `None`).
- Run it through `CrawlerDebugEmissionPaginator`; catch the `ValueError` it raises on a
  malformed `last_id` and return `400`.
- Return a bare JSON array (not wrapped in `{"results": [...]}`) — no `total`/`next`/
  `hasMore` fields.

Wire into `backend/staff/urls.py` (`staff/crawler.json`, matching `staff/cache.json`'s
flat-resource shape) and re-export from `backend/staff/views/__init__.py`.

## Files to Change

- `backend/staff/views/staff_crawler.py` — new, combined GET/POST view
- `backend/staff/views/__init__.py` — re-export `staff_crawler`
- `backend/staff/urls.py` — add the `staff/crawler.json` route (`GET`+`POST` on one path)
