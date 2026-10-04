# Access Statistics

Design notes for the staff-only **access statistics page** (#1477): a new staff menu entry
and seven tabs, each its own route under `/staff/statistics`, built on `statistics.Session`
(the visitor) and `statistics.Visit` (the activity, #1478).

> **Source of truth:** this spec supersedes the design sections of #1477's body. #1477
> remains the tracking issue.

## Pages

Status values: `decided` (settled, written in full), `stub` (structure only, owned by a spec
sub-issue), `specced` (filled in by its spec sub-issue).

### Foundations

- [Data model](access-statistics/data-model.md): `decided`
- [Access and security](access-statistics/access-and-security.md): `decided`

### Shared

- [Shared infrastructure](access-statistics/shared-infrastructure.md): `specced` (#1482)

### Tabs

- [Overview](access-statistics/overview.md): `specced` (#1483)
- [Visits](access-statistics/visits.md): `specced` (#1484)
- [Visitors](access-statistics/visitors.md): `specced` (#1485)
- [Duration](access-statistics/duration.md): `specced` (#1486)
- [Domains](access-statistics/domains.md): `specced` (#1487)
- [Users](access-statistics/users.md): `specced` (#1488)
- [Visit list](access-statistics/visit-list.md): `stub` (#1489)

## Sub-issue map

| Issue | Role | Status / owner |
|-------|------|----------------|
| #1478 | Track visits per statistics session (prerequisite) | Keeps [data model](access-statistics/data-model.md) in sync |
| #1480 | Ghost anonymous sessions (independent bug) | Assumed fixed |
| #1481 | Init the access statistics specs | This hub and its pages |
| #1482 | Spec: shared infrastructure | Owns `shared-infrastructure.md` |
| #1483 | Spec: Overview tab | Owns `overview.md` |
| #1484 | Spec: Visits tab | Owns `visits.md` |
| #1485 | Spec: Visitors tab | Owns `visitors.md` |
| #1486 | Spec: Duration tab | Owns `duration.md` |
| #1487 | Spec: Domains tab | Owns `domains.md` |
| #1488 | Spec: Users tab | Owns `users.md` |
| #1489 | Spec: Visit list tab | Owns `visit-list.md` |
| #1498 | Implementation: shared backend (aggregator, API conventions, domains endpoint) | Created by #1482 |
| #1499 | Implementation: frontend shell (menu, routes, tabs, filter bar, URL state) | Created by #1482; needs #1498 |
| #1500 | Implementation: Recharts setup (lazy chunk, sizing, test setup, colors) | Created by #1482; builds on #1499 |
| #1501 | Follow-up: client IP integrity (topology check failed) | Created by #1482; not blocking |
| #1503 | Implementation: Overview endpoint (`overview.json`) | Created by #1483; needs #1498; implemented last |
| #1504 | Implementation: Overview tab (KPI tiles) | Created by #1483; needs #1499 and #1503; implemented last |
| #1506 | Implementation: Visits endpoint (`visits.json`) | Created by #1484; needs #1498; first tab implemented |
| #1507 | Implementation: Visits tab (stacked bar chart) | Created by #1484; needs #1499, #1500 and #1506 |
| #1509 | Implementation: Visitors endpoint (`visitors.json`) | Created by #1485; needs #1498 |
| #1510 | Implementation: Visitors tab (two stacked bar charts) | Created by #1485; needs #1499, #1500 and #1509 |
| #1513 | Implementation: Duration endpoint (`duration.json`) | Created by #1486; needs #1498 |
| #1514 | Implementation: Duration tab (duration, hits per visit and histogram charts) | Created by #1486; needs #1499, #1500 and #1513 |
| #1516 | Implementation: Domains summary endpoint (`domains/summary.json`) | Created by #1487; needs #1498 |
| #1517 | Implementation: Domains tab (domain bar chart and table) | Created by #1487; needs #1499, #1500 and #1516 |
| #1519 | Implementation: Users ranking endpoint (`users.json`) | Created by #1488; needs #1498 |
| #1520 | Implementation: Users tab (ranking table) | Created by #1488; needs #1499 and #1519 |
| #1490 | Remove the access statistics specs | Blocked by every implementation sub-issue |

Each of #1482 to #1489 appends the implementation sub-issues it creates to this table.
