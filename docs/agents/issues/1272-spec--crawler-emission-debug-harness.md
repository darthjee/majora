# Issue: Spec: Crawler emission debug harness

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler). Companion
track to the dedicated crawler-import endpoint sub-issue (#1262) — while that
work is in progress, there's no way for a human to inspect what a crawler run is
actually emitting before it's wired into the real import endpoint. This issue
produces the persistent design doc for a **temporary, staff-only debug
harness**: a throwaway endpoint pair the crawler POSTs raw scraped JSON to, and a
staff page that lists what was captured for inspection.

This harness is deliberately **source-agnostic** — reused by every future
crawler, not just Lootstudios — which is why it's tracked at the #1260 parent
level rather than folded into #1261's Lootstudios-specific split.

## Problem

No documented contract exists yet for: the record shape a crawler POSTs, how
it's paginated/queried back, how it's stored given the deployment topology, or
when/how the harness itself gets removed once it's no longer needed. The sibling
backend and frontend sub-issues both need this settled before they can implement
anything.

## Solution

A new persistent spec doc `docs/agents/specs/crawler-test-harness.md` (added to
`docs/agents/specs.md`'s "Active specs" list — same convention #1261's split
introduced), documenting:

### Storage: a temporary DB table, not literal in-process memory

Production runs gunicorn with `--workers 4` (`backend/bin/server.sh`,
hardcoded). A plain in-process Python structure (e.g. a ring buffer) is **not**
shared across those workers — a `POST` handled by one worker could be invisible
to a `GET` handled by another, breaking the "load more" UI. A small Django
model (e.g. `CrawlerDebugEmission`: `id`, `created_at`, `source`, `type`,
`payload` JSONField) sidesteps this: naturally shared across workers, survives
restarts. Apply a retention cap (delete oldest rows beyond N, default e.g. 200)
to keep the same "bounded log" spirit as a real ring buffer despite being
DB-backed.

### Every record tagged by source and by type

Two distinct required tags, not one:

- **`source`** — which crawler/site emitted the record (e.g. `"lootstudios"`).
  Future-proofs filtering once more than one crawler exists.
- **`type`** — what kind of catalog entity the record is a candidate for (e.g.
  `"collection"`, `"stl_model"`, possibly `"source"`) — matches the target
  entity kinds the real import endpoint (#1262) ultimately creates. A single
  crawler run emits records of more than one `type` (e.g. a Lootstudios run
  emits both `collection` and `stl_model` records), so this is a genuinely
  separate axis from `source`, not an alias for it. It's also the grouping key
  for the new summary endpoint below.

### Wire contract (cursor-paginated, intentionally deviating from `docs/agents/pagination.md`)

This is a debug tool, not a public API, so cursor pagination (modeled on Navi's
own `GET /logs.json` / `GET /memory/history.json` pattern, and implemented
**exactly** as that reference specifies — this contract isn't just inspiration,
it's the contract) fits better than the repo's usual `page`/`per_page`
convention:

- `POST /staff/crawler.json` — body `{"source": "<crawler-kind>", "type": "<entity-kind>", "payload": {...arbitrary...}}`. Staff/superuser only.
- `GET /staff/crawler.json?last_id=<int>` — bare JSON array, oldest-first, of records with `id > last_id`. Capped to a server-side page size. No `total`/`next`/`hasMore` fields — the client derives the next cursor from the last element's `id`. Staff/superuser only.
- **`last_id` omitted** — returns from the **start** of the currently-retained window (oldest-first, capped to page size), *not* the newest page. This is the Navi "seed" call. The intended client shape is a drain-then-poll loop (mirrors the reference doc's §7): on load, fetch with no cursor, then keep re-fetching with the newest returned `id` as `last_id` for as long as a full page comes back (draining the whole retained history), then switch to polling on an interval once a fetch returns fewer than a full page (caught up) — watching a crawler run live is the primary use case this is designed for, not browsing a large archive. With the ~200-row retention cap and a ~50-row page size, initial catch-up is ~4 requests.
  - **Consequence for the frontend issue (#1274):** this rules out a scroll-triggered "load older on scroll down" pattern (`last_id` only moves forward/newer — there's no backward cursor in this contract). The correct client shape is closer to a drain/poll loop (e.g. `SessionMessagesController`'s cursor-tracking style) than `DocumentPagesBox`'s lazy scroll-to-load pattern, even though the visible result still reads as a growing, auto-scrolling list. #1274 has been corrected to reflect this.
- **`last_id` valid but evicted/nonexistent** — returns `[]`, deliberately indistinguishable from "caught up" (matches Navi's own documented quirk). A client seeing a persistent empty gap should reseed by retrying with no `last_id`.
- **`last_id` malformed (non-integer)** — deviates from Navi here: returns `400` with a clear validation error, rather than Navi's JS behavior of silently treating it as "not found" (`[]` forever). Silent-hang is worse than an explicit error for a debug tool.
- **POST payload validation** — `source` and `type` are both required and must be non-empty (`400` otherwise). No bespoke payload-size cap is introduced; Django/DRF's existing global `DATA_UPLOAD_MAX_MEMORY_SIZE` (default 2.5MB) already bounds request body size and is sufficient for this debug tool.

### Clearing and summarizing — a dashboard card, not the debug page itself

Revisited after further discussion: a manual purge **is** needed, surfaced as a
lightweight card on the existing `/#/staff/dashboard` (not on `/#/staff/crawler`
itself) — counts at a glance plus a one-click clear, exactly mirroring the
existing memory-cache card pattern:

- **Backend precedent, followed exactly**: `staff/cache.json` (`DELETE`, clears
  the whole process-wide memory cache) + `staff/cache/summary.json` (`GET`,
  returns counts) — see `backend/staff/views/staff_cache_clear.py` and
  `staff_cache_summary.py`. This harness reuses the same shape:
  - `GET /staff/crawler/summary.json` — staff/superuser only. Returns entry
    counts grouped by `type` (e.g. `{"stl_model": 42, "collection": 7}`).
  - `DELETE /staff/crawler.json` — staff/superuser only. Clears every row in
    the table (blanket clear, not scoped by `type`/`source` — the summary
    counts already give enough visibility to decide when a full clear makes
    sense). Returns `204`, matching `staff_cache_clear`'s convention.
- **Frontend precedent, followed exactly**: `MemoryCacheCard.jsx` /
  `MemoryCacheCardController.js` / `MemoryCacheCardHelper.jsx` +
  `ClearCacheConfirmModal.jsx` (confirmation before the destructive clear),
  registered via `dashboardCardConfig.js`. A new `CrawlerDebugCard` (or
  similar) follows this exact shape, showing the per-`type` counts and a
  confirm-then-clear button.
- These two endpoints, and the dashboard card, are split off as **#1275**
  (backend: summary + clear) and **#1276** (frontend: dashboard card) —
  further sub-issues of #1260, mirroring #1273/#1274's backend/frontend split
  rather than folding into them. The dashboard card lives on a different page
  (`/#/staff/dashboard`) than the record-browsing page (`/#/staff/crawler`),
  so it's a genuinely separate piece of frontend work, and pairing it with its
  own backend sub-issue keeps the backend/frontend split consistent with the
  rest of this harness.

### Removal plan

Explicitly document that the model, migration, endpoints, and frontend page are
all deleted once the real import endpoint (#1262) is trusted end-to-end — this
spec doc itself gets removed at that point too, per `docs/agents/specs.md`'s own
"deleted once the feature area is fully implemented" convention.

## Explicitly out of scope

- Any actual code (model, migration, views, frontend components) — that's the
  sibling backend and frontend sub-issues (record browsing: #1273/#1274;
  summary + clear: #1275/#1276).
- Redesigning #1262's real import contract.
- Support for more than one crawler source right now (the `source` tag just
  future-proofs against it).
- Scoping the `DELETE` clear to a specific `type`/`source` — it's a blanket
  clear for now.

## Acceptance criteria

- [ ] `docs/agents/specs/crawler-test-harness.md` exists with the wire contract
      (including `GET /staff/crawler/summary.json` and
      `DELETE /staff/crawler.json`), record shape (`source` + `type` +
      `payload`), retention-cap policy, multi-worker rationale, and removal plan
- [ ] `docs/agents/specs.md`'s "Active specs" list references it

## Benefits

Without this settled, #1273/#1274/#1275/#1276 would each have to guess at the
record shape and pagination semantics independently, risking exactly the kind
of drift already caught and corrected once during this issue's own
enhancement (the `type` field and the `last_id`-omitted behavior both changed
after the fact). Settling it once, here, means the four implementation
sub-issues can proceed against a single fixed contract instead of
reconverging later.

Owned by: `architect` (or `crawler`).
