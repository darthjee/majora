# Crawler Test Harness

A **temporary, staff-only debug harness** for inspecting what a crawler run is
actually emitting before it's wired into the real import endpoint (#1262).
Every future crawler POSTs its raw scraped JSON here — this harness is
deliberately **source-agnostic**, not specific to Lootstudios. It exists only
to unblock development; it is deleted once #1262's real import endpoint is
trusted end-to-end (see "Removal plan" below).

Implemented by four sub-issues of #1260: record browsing (#1273 backend,
#1274 frontend) and summary + clear (#1275 backend, #1276 frontend).

## Storage: a temporary DB table, not literal in-process memory

Production runs gunicorn with `--workers 4` (`backend/bin/server.sh`,
hardcoded). A plain in-process Python structure (e.g. a ring buffer) is
**not** shared across those workers — a `POST` handled by one worker could be
invisible to a `GET` handled by another, breaking the "load more" UI.

Instead, use a small Django model, e.g.:

```
CrawlerDebugEmission
  id        (PK)
  created_at
  source    (string, required)
  type      (string, required)
  payload   (JSONField, arbitrary)
```

This is naturally shared across workers and survives restarts. Apply a
retention cap (delete oldest rows beyond N, default e.g. 200) to keep the
same "bounded log" spirit as a real ring buffer despite being DB-backed.

## Record shape: tagged by source and by type

Every record carries two distinct required tags, not one:

- **`source`** — which crawler/site emitted the record (e.g.
  `"lootstudios"`). Future-proofs filtering once more than one crawler
  exists.
- **`type`** — what kind of catalog entity the record is a candidate for
  (e.g. `"collection"`, `"stl_model"`, possibly `"source"`) — matches the
  target entity kinds the real import endpoint (#1262) ultimately creates. A
  single crawler run emits records of more than one `type` (e.g. a
  Lootstudios run emits both `collection` and `stl_model` records), so this
  is a genuinely separate axis from `source`, not an alias for it. It's also
  the grouping key for the summary endpoint below.
- **`payload`** — arbitrary, crawler-defined JSON. No schema is enforced
  beyond `source`/`type` being present.

## Wire contract (cursor-paginated, intentionally deviating from `docs/agents/pagination.md`)

This is a debug tool, not a public API, so cursor pagination fits better than
the repo's usual `page`/`per_page` convention. It is modeled on, and
implemented **exactly** as, Navi's own `GET /logs.json` /
`GET /memory/history.json` pattern — this contract isn't just inspiration, it
is the contract.

- `POST /staff/crawler.json` — body
  `{"source": "<crawler-kind>", "type": "<entity-kind>", "payload": {...arbitrary...}}`.
  Staff/superuser only.
- `GET /staff/crawler.json?last_id=<int>` — bare JSON array, oldest-first, of
  records with `id > last_id`. Capped to a server-side page size. No
  `total`/`next`/`hasMore` fields — the client derives the next cursor from
  the last element's `id`. Staff/superuser only.
- **`last_id` omitted** — returns from the **start** of the currently-retained
  window (oldest-first, capped to page size), *not* the newest page. This is
  the Navi "seed" call. The intended client shape is a drain-then-poll loop:
  on load, fetch with no cursor, then keep re-fetching with the newest
  returned `id` as `last_id` for as long as a full page comes back (draining
  the whole retained history), then switch to polling on an interval once a
  fetch returns fewer than a full page (caught up) — watching a crawler run
  live is the primary use case this is designed for, not browsing a large
  archive. With the ~200-row retention cap and a ~50-row page size, initial
  catch-up is ~4 requests.
  - **Consequence for the frontend (#1274):** this rules out a
    scroll-triggered "load older on scroll down" pattern (`last_id` only
    moves forward/newer — there's no backward cursor in this contract). The
    correct client shape is closer to a drain/poll loop (e.g.
    `SessionMessagesController`'s cursor-tracking style) than
    `DocumentPagesBox`'s lazy scroll-to-load pattern, even though the visible
    result still reads as a growing, auto-scrolling list.
- **`last_id` valid but evicted/nonexistent** — returns `[]`, deliberately
  indistinguishable from "caught up" (matches Navi's own documented quirk). A
  client seeing a persistent empty gap should reseed by retrying with no
  `last_id`.
- **`last_id` malformed (non-integer)** — deviates from Navi here: returns
  `400` with a clear validation error, rather than Navi's JS behavior of
  silently treating it as "not found" (`[]` forever). Silent-hang is worse
  than an explicit error for a debug tool.
- **POST payload validation** — `source` and `type` are both required and
  must be non-empty (`400` otherwise). No bespoke payload-size cap is
  introduced; Django/DRF's existing global `DATA_UPLOAD_MAX_MEMORY_SIZE`
  (default 2.5MB) already bounds request body size and is sufficient for
  this debug tool.

## Clearing and summarizing — a dashboard card, not the debug page itself

A manual purge is needed, surfaced as a lightweight card on the existing
`/#/staff/dashboard` (not on `/#/staff/crawler` itself) — counts at a glance
plus a one-click clear, exactly mirroring the existing memory-cache card
pattern.

**Backend precedent, followed exactly**: `staff/cache.json` (`DELETE`,
clears the whole process-wide memory cache) + `staff/cache/summary.json`
(`GET`, returns counts) — see `backend/staff/views/staff_cache_clear.py` and
`backend/staff/views/staff_cache_summary.py`. This harness reuses the same
shape:

- `GET /staff/crawler/summary.json` — staff/superuser only. Returns entry
  counts grouped by `type` (e.g. `{"stl_model": 42, "collection": 7}`).
- `DELETE /staff/crawler.json` — staff/superuser only. Clears every row in
  the table (blanket clear, not scoped by `type`/`source` — the summary
  counts already give enough visibility to decide when a full clear makes
  sense). Returns `204`, matching `staff_cache_clear`'s convention.

**Frontend precedent, followed exactly**: `MemoryCacheCard.jsx` /
`MemoryCacheCardController.js` / `MemoryCacheCardHelper.jsx` +
`ClearCacheConfirmModal.jsx` (confirmation before the destructive clear),
registered via `dashboardCardConfig.js`. A new `CrawlerDebugCard` (or
similar) follows this exact shape, showing the per-`type` counts and a
confirm-then-clear button.

These two endpoints, and the dashboard card, are split off as **#1275**
(backend: summary + clear) and **#1276** (frontend: dashboard card) —
further sub-issues of #1260, mirroring #1273/#1274's backend/frontend split
rather than folding into them. The dashboard card lives on a different page
(`/#/staff/dashboard`) than the record-browsing page (`/#/staff/crawler`),
so it's a genuinely separate piece of frontend work, and pairing it with its
own backend sub-issue keeps the backend/frontend split consistent with the
rest of this harness.

## Removal plan

The model, migration, endpoints, and frontend pages are all deleted once
#1262's real import endpoint is trusted end-to-end. This spec doc is deleted
at that point too, per `docs/agents/specs.md`'s own "deleted once the feature
area is fully implemented" convention.

## Explicitly out of scope

- Redesigning #1262's real import contract.
- Support for more than one crawler source right now (the `source` tag just
  future-proofs against it).
- Scoping the `DELETE` clear to a specific `type`/`source` — it's a blanket
  clear for now.
