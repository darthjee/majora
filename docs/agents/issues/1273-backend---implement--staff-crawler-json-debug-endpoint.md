# Issue: Backend — implement /staff/crawler.json debug endpoint

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler).
Implements the backend half of the temporary crawler emission debug harness
specified in the sibling sub-issue "Spec: Crawler emission debug harness"
(landed as `docs/agents/specs/crawler-test-harness.md`, fixed by #1272) —
this is the wire contract this issue implements against.

## Problem

Nothing today lets a crawler dump raw scraped JSON for staff review before it's
trusted enough to feed the real import endpoint (#1262). This is scaffolding for
that gap — temporary, staff-only, deleted once #1262 is proven.

## Scope

### Model

A new Django model `CrawlerDebugEmission` (or similar) with fields: `id`
(auto), `created_at` (auto_now_add), `source` (required `CharField`, e.g.
`"lootstudios"` — which crawler/site emitted the record), `type` (required
`CharField`, e.g. `"stl_model"`/`"collection"` — what kind of catalog entity
the record is a candidate for; a single crawler run emits more than one
`type`, so this is a separate axis from `source`, not an alias for it, and is
also the grouping key for the summary endpoint added in the sibling sub-issue
"Backend — crawler debug harness summary + clear endpoints"), `payload`
(`JSONField`, arbitrary crawler-emitted JSON). New migration. Keep this model
out of any serializer/API surface other than the two endpoints below — it
isn't part of the miniatures catalog.

### Cursor query helper

No existing precedent in this codebase — `backend/games/paginator.py`'s
`Paginator` is page/per_page and queryset-`.count()`-oriented, not reusable for
a `last_id` cursor. Implement a small helper: given `last_id`, return rows with
`id > last_id`, oldest-first, capped to a server-side page size.

**`last_id` omitted returns from the start** of the currently-retained window
(oldest-first, capped to page size) — *not* the newest page. This is
deliberate (the Navi "seed" call, per the spec's wire contract): the intended
client is a drain-then-poll loop that replays the full retained history on
load, then polls for new arrivals — see the frontend sub-issue.

**`last_id` malformed (non-integer)** returns `400` with a clear validation
error — a deliberate deviation from the Navi reference (which silently treats
this as "not found" forever); silent-hang is worse than an explicit error here.

**`last_id` valid but evicted/nonexistent** returns `[]`, indistinguishable
from "caught up" (matches Navi's own documented quirk).

### Retention cap

On each insert, if the table exceeds a configured cap (default 200 rows),
delete the oldest rows beyond it — keeps the table bounded like a ring buffer
despite being DB-backed.

### Endpoints

`POST /staff/crawler.json` and `GET /staff/crawler.json?last_id=<int>`,
following the existing `backend/staff/views/` pattern (`staff_cache_summary.py`
is the concrete template: `@restricted` + `@api_view` + `@permission_classes([AllowAny])`
+ inline `require_staff(request)` check for the correct 401/403 body shape).
Wire into `backend/staff/urls.py`, re-export from `backend/staff/views/__init__.py`.

- `POST` body: `{"source": "<crawler-kind>", "type": "<entity-kind>", "payload": {...}}` → `source` and `type` both required (non-empty, else `400`) → creates a record, applies the retention cap, returns the created record (id + timestamp + source + type + payload).
- `GET ?last_id=<int>` → bare JSON array, oldest-first, of records with `id > last_id` (from the start of the window if omitted — see above), capped to page size (default 50). No `total`/`next`/`hasMore`.
- No bespoke payload-size cap — Django/DRF's existing global `DATA_UPLOAD_MAX_MEMORY_SIZE` (default 2.5MB) already bounds request body size.

### Access control docs

New `docs/agents/access-control/*.md` entry documenting the endpoint's access
rule (staff/superuser only via `require_staff`), referenced from
`access-control.md`'s index — same precedent as `staff-cache.md`.

### Crawler auth checklist

Verify the crawler's service-account user has `is_staff=True` (or is
superuser) — the crawler already authenticates via API token
(`CookieTokenAuthentication`), so no new auth flow is needed, but this hasn't
been confirmed. If not already flagged, flip it.

## Explicitly out of scope

- Any frontend work (sibling sub-issue "Frontend — /#/staff/crawler two-column
  debug page").
- The `GET /staff/crawler/summary.json` and `DELETE /staff/crawler.json`
  endpoints (sibling sub-issue "Backend — crawler debug harness summary +
  clear endpoints", #1275).
- The real crawler-import endpoint's actual upsert logic (#1262).
- Removing/dropping this harness once #1262 supersedes it (tracked as a TODO in
  the spec doc, not its own issue yet).

## Acceptance criteria

- [ ] `CrawlerDebugEmission` model + migration exist (`source`, `type`,
      `payload`), scoped to this debug harness only
- [ ] `POST /staff/crawler.json` requires `source` and `type`, creates a
      record, and applies the retention cap
- [ ] `GET /staff/crawler.json?last_id=<int>` returns the cursor-paginated bare
      JSON array per the spec's wire contract, including the "no `last_id`
      returns from the start" and "malformed `last_id` returns `400`" behaviors
- [ ] Both endpoints are staff/superuser-only (`require_staff`) and return
      `X-Skip-Cache: true` (`@restricted`)
- [ ] New access-control doc entry added and linked from `access-control.md`
- [ ] Crawler service-account staff/superuser status verified (and fixed if
      needed)
- [ ] Tests cover: create (including required-field validation), cursor
      pagination (`last_id` present/absent/malformed/evicted), retention
      eviction, and the staff-only access check

Owned by: `backend`.
