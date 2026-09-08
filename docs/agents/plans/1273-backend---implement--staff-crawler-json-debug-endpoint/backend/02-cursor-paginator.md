# Cursor pagination helper

`backend/games/paginator.py`'s `Paginator` is page/per-page and queryset-`.count()`-
oriented; `backend/games/session_message_paginator.py`'s `SessionMessagePaginator` is the
closer stylistic precedent (small class, module-level `PAGE_SIZE` constant, `(page,
headers-or-plain-list)` return shape) but walks **backward** via a `<=`/`NEXT-ENTRY-ID`
cursor — the opposite direction from this issue's forward-only, oldest-first `last_id`
contract. Add a new, dedicated class rather than reusing either.

`CrawlerDebugEmissionPaginator` (per `docs/agents/specs/crawler-test-harness.md`'s wire
contract):

- Constructed with the request and the model's queryset (ordered ascending by `id`, per
  step 01's `Meta.ordering`).
- `paginate()` returns the page as a plain list: rows with `id > last_id` (or from the
  very start when `last_id` is absent/`None`), capped to `PAGE_SIZE = 50`.
- `last_id` malformed (present but not parseable as an int) raises a `ValueError` from
  `paginate()` — the view in step 03 catches it and turns it into the `400` response,
  keeping the "malformed → 400" validation visible at the view layer alongside the other
  field validation, rather than swallowing it silently the way `SessionMessagePaginator`
  does for its own cursor param.
- `last_id` valid but evicted/nonexistent naturally returns `[]` — no special-casing
  needed, `id > last_id` on a still-valid integer just yields nothing if every row above
  it was itself evicted by the retention cap.

Also add the retention-cap eviction helper in the same module (a plain function, not part
of the paginator class — it runs on insert, not on read): after creating a row, if
`CrawlerDebugEmission.objects.count() > RETENTION_CAP` (`RETENTION_CAP = 200`), delete the
oldest rows beyond the cap (e.g. via the lowest surviving `id` cutoff, in one query rather
than row-by-row).

## Files to Change

- `backend/staff/crawler_debug_emission_paginator.py` — new: `CrawlerDebugEmissionPaginator`
  class + `enforce_retention_cap(queryset, cap)` (or equivalent name)
