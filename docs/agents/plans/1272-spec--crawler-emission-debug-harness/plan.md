# Plan: Spec: Crawler emission debug harness

Issue: [1272-spec--crawler-emission-debug-harness.md](../../issues/1272-spec--crawler-emission-debug-harness.md)

## Overview

Write the persistent spec doc for the temporary crawler emission debug harness
— the wire contract, record shape, storage rationale, and removal plan that
sibling sub-issues #1273, #1274, #1275, and #1276 implement against.
Documentation only, no code.

## Context

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler),
alongside #1262 (the real crawler-import endpoint this harness is scaffolding
in front of). Everything the spec needs to say was already worked out during
this issue's own discussion/enhancement passes and lives in the issue file's
`## Solution` section:

- **Storage**: a temporary Django model (e.g. `CrawlerDebugEmission`:
  `id`, `created_at`, `source`, `type`, `payload` JSONField), not literal
  in-process memory — production runs gunicorn with `--workers 4`
  (`backend/bin/server.sh`), so a plain in-process structure wouldn't be
  shared across workers. A retention cap (default e.g. 200 rows) keeps it
  bounded like a ring buffer despite being DB-backed.
- **Record shape**: two distinct required tags — `source` (which
  crawler/site, e.g. `"lootstudios"`) and `type` (which catalog entity kind,
  e.g. `"stl_model"`/`"collection"` — a single crawler run emits more than
  one `type`, so this is a separate axis from `source`).
- **Wire contract**: `POST`/`GET /staff/crawler.json`, cursor-paginated via
  `?last_id=`, modeled on and implemented exactly as Navi's own
  `GET /logs.json` / `GET /memory/history.json` pattern
  (`~/messages/in-memmory-records.md` was the reference used while working
  this out) — bare JSON array, oldest-first, no `total`/`next`/`hasMore`.
  `last_id` omitted returns from the **start** of the retained window (not
  the newest page) — the intended client shape is a drain-then-poll loop, not
  scroll-to-load-older. Evicted/nonexistent `last_id` returns `[]`
  (indistinguishable from "caught up", matching Navi's own documented quirk).
  Malformed (non-integer) `last_id` returns `400` (a deliberate deviation from
  Navi, which silently no-ops this case). `source`/`type` are required on
  `POST` (`400` otherwise); no bespoke payload-size cap beyond Django/DRF's
  existing global `DATA_UPLOAD_MAX_MEMORY_SIZE`.
- **Summary + clear pair**: `GET /staff/crawler/summary.json` (counts grouped
  by `type`) and `DELETE /staff/crawler.json` (blanket clear), copying the
  existing `staff/cache.json` + `staff/cache/summary.json` precedent
  (`backend/staff/views/staff_cache_clear.py` /
  `staff_cache_summary.py`) exactly. Surfaced as a dashboard card, not on the
  debug page itself — implemented in #1275 (backend) / #1276 (frontend).
- **Removal plan**: the model, migration, endpoints, and frontend pages are
  all deleted once #1262's real import endpoint is trusted end-to-end — this
  spec doc is deleted at that point too, per `docs/agents/specs.md`'s own
  "deleted once the feature area is fully implemented" convention.

## Implementation Steps

### Step 1 — Write `docs/agents/specs/crawler-test-harness.md`

Create the new spec doc. Follow `docs/agents/specs/loot-crawling.md` for
tone/register (a short intro paragraph, then organized sections) but as a
**single flat file**, not a multi-aspect hub-plus-pages split like
`loot-crawling.md` — this is one contract, not several independently-sized
sub-aspects. Cover, as sections: storage (temporary DB table + multi-worker
rationale + retention cap), record shape (`source` + `type` + `payload`),
the full wire contract (all `last_id` cases, POST validation), the
summary/clear pair (naming the `staff_cache_clear.py`/`staff_cache_summary.py`
precedent explicitly so the implementing agent finds it immediately), and the
removal plan. The issue file's own `## Solution` section already contains
near-final prose for all of this — this step is mostly reorganizing it into a
standalone doc, not writing from scratch.

### Step 2 — Add it to the specs hub

In `docs/agents/specs.md`, add a bullet to the existing "Active specs" list:
`- [Crawler Test Harness](specs/crawler-test-harness.md)`, alongside the
existing `- [Loot Crawling](specs/loot-crawling.md)` entry.

## Files to Change

- `docs/agents/specs/crawler-test-harness.md` — new spec doc (create)
- `docs/agents/specs.md` — add the new spec to "Active specs"

## Notes

- Purely documentation — no backend/frontend/infra/crawler code changes, so
  no specialist agent has implementation work here. This plan is owned
  directly by `architect`, matching the issue's own
  "Owned by: `architect` (or `crawler`)" line.
- `AGENTS.md`'s documentation table and `docs/agents/index.md`/`summary.md`
  still don't reference `docs/agents/specs.md` at all — a gap #1261 originally
  scoped for itself but never actually closed (#1265/#1266 only added aspect
  pages under the already-existing hub). That gap is pre-existing and out of
  scope here; this issue only asks to add the new spec to `specs.md`'s own
  list, mirroring exactly what #1265/#1266 already did.
