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
- [Visits](access-statistics/visits.md): `stub` (#1484)
- [Visitors](access-statistics/visitors.md): `stub` (#1485)
- [Duration](access-statistics/duration.md): `stub` (#1486)
- [Domains](access-statistics/domains.md): `stub` (#1487)
- [Users](access-statistics/users.md): `stub` (#1488)
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
| #1490 | Remove the access statistics specs | Blocked by every implementation sub-issue |

Each of #1482 to #1489 appends the implementation sub-issues it creates to this table.
