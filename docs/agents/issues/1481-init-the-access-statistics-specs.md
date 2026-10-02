# Issue: Init the access statistics specs

## Description

First sub-issue of #1477. Create the access statistics spec: a persistent design doc
(see `docs/agents/specs.md`) that the following spec sub-issues fill in, one page each.

### Context

Part of the staff **access statistics page** (parent #1477): a staff-only page (`staffOrSuperuser`) with a new staff menu entry and seven tabs (Overview, Visits, Visitors, Duration, Domains, Users, Visit list), each its own route under `/staff/statistics`.

Key decisions already made in #1477:

- **Data:** `statistics.Session` is the long-lived **visitor** (device/browser) identity. Activity comes from the new `statistics.Visit` model (#1478): `session`, `started_at`, `last_seen_at`, `hits`, with a 30-minute inactivity window. #1480 (ghost anonymous sessions) is assumed fixed.
- **Visitor key:** `user_id` when the session has a user, otherwise the session id.
- **Access:** staff-only, GET-only endpoints under `staff/statistics/...json`, following the `staff_cache_summary` pattern (`@restricted`, `require_staff`). All staff see everything, including IPs.
- **Aggregation:** on the fly, bucketed **in Python** (`zoneinfo`, browser time zone), with zero-filled buckets and a capped date range. There are no rollups.
- **Charts:** Recharts 3, lazy-loaded. Each chart has a client, a controller (no JSX) and a pure render helper; chart components get smoke tests only.
- **Shared filter bar:** date range, user, domain, audience (anonymous/logged-in) and granularity, kept in the URL query.

Spec hub: `docs/agents/specs/access-statistics.md` (created by the first spec sub-issue).

## Problem

The access statistics feature (#1477) has its decisions recorded only in #1477's issue body.
Eight spec sub-issues (#1482 to #1489) need to refine those decisions in parallel. Without a
shared, structured spec already in place, each would create its own pages, causing merge
conflicts and divergent structure, and decisions would drift between #1477 and the docs.

## Expected Behavior

- [ ] The hub and all ten pages exist (two foundation pages, shared infrastructure, seven tab stubs), linked from the hub with their status.
- [ ] All seven tab stubs follow the template, and their "To define" items match their owning
      sub-issues exactly.
- [ ] The decisions recorded in #1477 are carried over accurately.
- [ ] The spec is listed in `docs/agents/specs.md`.
- [ ] The hub has a sub-issue map: #1478, #1480 and #1481 to #1490.
- [ ] Documentation only: no code changes.

## Solution

### What to do

Create the spec following the `loot-crawling` pattern: a **thin hub**, with all substance in
pages.

```
docs/agents/specs/
├── access-statistics.md                 # hub: thin
└── access-statistics/
    ├── data-model.md                    # foundation: full (#1481)
    ├── access-and-security.md           # foundation: full (#1481)
    ├── shared-infrastructure.md         # partly filled (#1481), completed by #1482
    ├── overview.md                      # stub → #1483
    ├── visits.md                        # stub → #1484
    ├── visitors.md                      # stub → #1485
    ├── duration.md                      # stub → #1486
    ├── domains.md                       # stub → #1487
    ├── users.md                         # stub → #1488
    └── visit-list.md                    # stub → #1489
```

#### Hub: `access-statistics.md` (about 30 to 40 lines)

- A 2 to 3 line intro: what the feature is, staff-only, seven tabs.
- A **source-of-truth note**: this spec supersedes #1477's body.
- **Pages**, grouped as *Foundations* (data model, access & security), *Shared* (shared
  infrastructure) and *Tabs* (the seven), each with a status: `decided` / `stub` / `specced`.
- The **sub-issue map**: #1478, #1480, #1481 to #1490, with implementation issues added later
  by #1482 to #1489.

#### Foundation pages (written in full)

- **`data-model.md`**:
  - `Session` as the visitor and `Visit` as the activity (#1478), described as proposed, or
    as merged if #1478 has landed;
  - the visitor key;
  - the #1480 outcome assumption (no ghost anonymous rows);
  - the **counting rules and caveats**:
    - proxy-cached responses are invisible;
    - an anonymous visitor whose IP changes, and a user who logs out, are counted more than
      once;
    - a null domain is shown as "unknown";
    - deleted users look anonymous;
    - staff traffic is counted.

  #1478 keeps this page in sync.
- **`access-and-security.md`**:
  - the permissions content (see [Permissions page content](#permissions-page-content));
  - input validation rules;
  - IP integrity via the proxy's `SetClientIpMiddleware`, plus the production topology check;
  - links to `access-control/statistics.md` (#1478) and the future `staff-statistics.md`.

#### `shared-infrastructure.md` (partly filled)

This page carries what #1477 already **decided**:

- on-the-fly aggregation, with no rollups;
- Python-side bucketing, and why (MySQL `CONVERT_TZ` needs tz tables; no `MEDIAN`);
- the browser time zone;
- zero-filled buckets;
- bounded responses;
- the filter bar controls and defaults;
- filters in the URL query;
- Recharts conventions (three layers, CSS-variable colors, smoke tests) and lazy-loading.

The items #1482 completes are listed as open: granularity thresholds, the range cap, API
conventions and response envelope, the aggregator interface, chart sizing, the `staffStatistics`
RequestStore config, `staff-statistics.md` / `permissions.yaml`, and the production topology
check.

Performance decisions live here, not on their own page, because they directly shape the
aggregator #1482 designs.

#### Tab stubs

Each of the seven tab pages uses the template below. A stub **already has the final page's
structure**, so #1483 to #1489 fill in sections rather than restructure, and all tab pages end
up uniform.

```markdown
# <Tab> tab

> **Status:** stub · **Owner:** #14xx · **Route:** `/staff/statistics/<tab>`

## Purpose
One or two lines, from #1477.

## Decided
- Bullets already settled in #1477 for this tab (content, splits, ordering notes,
  e.g. "implemented first" for Visits, "implemented last" for Overview).

## Metrics
_To define (#14xx):_ the exact definition of each metric in terms of `Visit` and the
visitor key (see [data model](data-model.md)).

## Filters
_To define (#14xx):_ which shared filters apply, and any tab-specific behavior
(see [shared infrastructure](shared-infrastructure.md)).

## Chart and layout
_To define (#14xx):_ chart type(s), series, tooltip contents, empty state.

## API
_To define (#14xx):_ endpoint path, extra params beyond the shared ones, and a
response example.

## Edge cases
_To define (#14xx):_ tab-specific cases (empty range, single-hit visits, …).

## Open questions
- The "to define" checklist items from the owning sub-issue that don't fit above.

## Implementation sub-issues
_Created by #14xx._
```

Rules:

- **Status:** `stub` when written by #1481, and `specced` once its spec sub-issue closes. The
  hub's page list mirrors it.
- **"To define" items** come only from the owning sub-issue's checklist. #1481 copies them in
  and adds nothing new.
- **Stubs link** to the foundation pages and `shared-infrastructure.md` rather than repeating
  them.
- **`shared-infrastructure.md`** uses a reduced shape: *Status / Owner*, *Decided*,
  *To define*, *Open questions*, *Implementation sub-issues*. It has no single endpoint or
  chart.
- **Foundation pages** are prose (like `loot-crawling/model-changes.md`), with a
  `Status: decided` line.

#### Registration

Register the spec under "Active specs" in `docs/agents/specs.md`.

### Scope

This issue **transcribes and structures decisions already made in #1477**. It makes no new
decisions.

#### In scope

- The spec hub, the `docs/agents/specs/access-statistics/` folder, and the "Active specs"
  entry in `docs/agents/specs.md`.
- The **cross-cutting decisions from #1477, written in full**:
  - data model: `Session` as the visitor, `Visit` (#1478), the visitor key;
  - edge cases and accepted approximations;
  - permissions;
  - performance & security.
- A **dependencies / sub-issue map**:
  - #1478 and #1480, with the assumptions the spec makes about them;
  - the sub-issues mapped to their numbers: init #1481, shared infrastructure #1482,
    Overview #1483, Visits #1484, Visitors #1485, Duration #1486, Domains #1487, Users #1488,
    Visit list #1489, removal #1490.
- **Stub pages** for shared infrastructure and the 7 tabs. Each holds only what #1477 decided
  for that area, the "to define" checklist from its owning sub-issue, and that sub-issue's
  number.

#### Out of scope

- **Any new decision**: granularity thresholds, range cap, KPI definitions, response shapes,
  chart types, and so on. These belong to #1482 to #1489. A stub may list them as open but
  never answers them.
- **Code**, including the permanent `docs/agents/access-control/staff-statistics.md`, which is
  created by the shared-infrastructure implementation (per #1482).
- `docs/agents/index.md` / `summary.md`: specs are registered only in `specs.md`.
- Changing #1478 or #1480: the spec only references them.

#### Keeping the `Visit` description accurate

The data-model page describes `Visit` **as proposed in #1478** (fields, 30-minute window,
write throttle, login-rotation behavior). If #1478's plan or PR diverges, **#1478 updates the
spec page** (this is an acceptance criterion on #1478). If #1478 lands before this issue, this
issue describes `Visit` from the merged code rather than the proposal.

### Edge cases

- **Sequencing:** #1482 to #1489 are explicitly **blocked by this issue** (and #1483 to #1489
  also by #1482), so none of them creates its own pages before the hub and stubs exist.
- **Source of truth:** #1477's body already carries a note (added during refinement) saying
  that once this issue is merged, the spec is the source of truth and #1477 remains the
  tracking issue. Nothing to do on GitHub here; the hub repeats the note.
- **Sub-issue map upkeep:** the hub's map starts with #1478, #1480 and #1481 to #1490. Each of
  #1482 to #1489 adds the implementation sub-issues it creates (an acceptance criterion on
  those issues).
- **#1480 is described by outcome only:** "no ghost anonymous `Session` rows". Its fix
  mechanism is not described, so the spec stays valid whichever approach #1480 picks.
- **Code references** (e.g. `staff_cache_summary.py`, `SetClientIpMiddleware`,
  `HashRouteResolver.js`, `accessRouteConfig.js`) are accurate as of writing and are not
  actively maintained. #1490 checks links before deleting the spec.

### Permissions page content

The spec's permissions page transcribes #1477's decisions:

- **Backend:** staff-or-superuser, GET-only `staff/statistics/...json` endpoints following the
  `staff_cache_summary` pattern: `@restricted` / `X-Skip-Cache` and an inline `require_staff`
  check, so anonymous callers get 401 and non-staff get 403.
- **Frontend:**
  - `staffOrSuperuser` route gates in `accessRouteConfig.js`;
  - the menu entry is visible to staff only;
  - a `staffStatistics` RequestStore config with `permission: null` and no
    `RequestPermissionResolvers.js` entry (the `staffUser` / #842 precedent).
- **Data visibility:** all staff see everything, including IPs.

It also states that:

- **The spec page is a draft.** The authoritative per-endpoint doc will be
  `docs/agents/access-control/staff-statistics.md` (in the shape of `staff-cache.md`), created
  by the shared-infrastructure implementation. #1490 checks the two agree before deleting the
  spec.
- **Model-level access** for `statistics.Session` / `Visit` is documented in
  `docs/agents/access-control/statistics.md`, created by #1478. The spec links to it.
- The **shared-infrastructure stub** lists, among its open items, whether
  `docs/agents/permissions.yaml` needs a note under the `staff` scope for statistics reads. This
  is decided and done in the implementation.

### Why hub + folder

Alternatives considered:

- **A single spec file** (`crawler-test-harness.md` precedent): rejected. Eight sub-issues
  (#1482 to #1489) would edit the same file in parallel and keep hitting merge conflicts, and
  the file would grow past 1000 lines, so agents would load every tab to read one.
- **No spec, with the GitHub issues as the design**: rejected. Decisions would scatter across
  issue bodies with no single current picture.
- **Writing straight into permanent docs**: rejected. In-progress design would mix into docs
  that agents treat as authoritative.

A **hub + folder** (`loot-crawling` precedent) gives one page per sub-issue, so they can run in
parallel without conflicts. Agents load only the page they need, and removal (#1490) is clean.

## Benefits

- One page per spec sub-issue, so #1482 to #1489 can run in parallel without conflicts.
- A single source of truth for the feature's design, replacing #1477's body.
- Uniform tab pages: stubs already have the final structure, so later issues fill them in
  rather than restructure them.
- A clean removal path (#1490).
