# Issue: Remove the access statistics specs

## Description

Final sub-issue of #1477 (staff access statistics page). Once every access statistics
implementation sub-issue has landed, retire the spec: move its lasting knowledge into the
permanent docs, then delete `docs/agents/specs/access-statistics.md` and the
`docs/agents/specs/access-statistics/` folder (ten files, ~2,800 lines). Per
`docs/agents/specs.md`, a spec is removed only once its knowledge lives in the permanent docs.

Blocked by every implementation sub-issue of #1477: #1498, #1499, #1500, #1503, #1504,
#1506, #1507, #1509, #1510, #1513, #1514, #1516, #1517, #1519, #1520, #1522, #1523.

## Problem

The spec is a temporary design doc. Once the feature ships, it goes stale and duplicates the
code. Permanent docs already link into it, so deleting it naively would leave broken links:
- `docs/agents/access-control/statistics.md` links to `specs/access-statistics/data-model.md`;
- `docs/agents/access-control/staff-statistics.md` links to
  `specs/access-statistics/shared-infrastructure.md` and still carries a "Status: planned" note;
- `docs/agents/specs.md` lists it under "Active specs".

## Expected Behavior

- A new **`docs/agents/statistics.md`** feature doc (like `crawler.md` / `cache-warmer.md`),
  registered in `docs/agents/index.md` and `summary.md`, holds:
  - the `Session`-as-visitor and `Visit` semantics (30-minute inactivity window), the visitor
    key (`user_id` when there is a user, otherwise the session id), metric definitions and
    counting caveats;
  - the client IP caveat: stored IPs are best effort until #1501 is fixed. #1501 does **not**
    block this issue;
  - the API conventions for `staff/statistics/*.json` (filters, bucketing in Python with
    `zoneinfo` and the browser time zone, zero-filled buckets, capped date range, no rollups)
    and the list of endpoints and tabs.
- A new **`docs/agents/frontend/charts.md`** (linked from `docs/agents/frontend/index.md`)
  holds the generic Recharts conventions: lazy-loaded chunk, sizing, colors, a client, a
  controller (no JSX) and a pure render helper per chart, and smoke tests only for chart
  components. Future charts can reuse it.
- `docs/agents/access-control/staff-statistics.md` lists every endpoint row and no longer
  has the "Status: planned" note.
- Design rationale, rejected alternatives, per-tab UI mock-ups and sub-issue breakdown tables
  are dropped, not migrated.
- The spec hub and folder are deleted, the "Active specs" entry is removed from `specs.md`,
  and no links point at the spec.

## Solution

1. Write `docs/agents/statistics.md` and `docs/agents/frontend/charts.md`, and register them
   (`index.md`, `summary.md`, `frontend/index.md`).
2. Repoint the spec links in `access-control/statistics.md` and
   `access-control/staff-statistics.md` to `statistics.md`. Remove the "Status: planned" note.
3. Delete `docs/agents/specs/access-statistics.md` and `docs/agents/specs/access-statistics/`.
4. Remove the entry from "Active specs" in `docs/agents/specs.md`.
5. Check that nothing outside `docs/agents/issues/` and `docs/agents/plans/` still references
   `specs/access-statistics` (`grep -rn "specs/access-statistics"`).

Documentation only: no code changes.

## Benefits

- One permanent source of truth for the statistics feature, with no stale design doc.
- No broken links in the agent docs.
