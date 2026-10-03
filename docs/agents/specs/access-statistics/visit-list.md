# Visit list tab

> **Status:** stub · **Owner:** #1489 · **Route:** `/staff/statistics/visit-list` · Back to
> the [hub](../access-statistics.md)

## Purpose

Paginated raw list of visits: user, IP, domain, start, duration, hits.

## Decided

- Lists **visits**, not long-lived sessions (see [data model](data-model.md)).
- Raw IPs are visible to all staff, with no masking (see
  [access and security](access-and-security.md)).
- Paginated per [`pagination.md`](../../pagination.md).

## Metrics

_To define (#1489):_ the columns: user, IP, domain, start, duration, hits (see
[data model](data-model.md)).

## Filters

_To define (#1489):_ how filters apply (see [shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1489):_ sort order; pagination (per [`pagination.md`](../../pagination.md));
whether a row links anywhere (e.g. to the user filter).

## API

_To define (#1489):_ the endpoint response shape.

## Edge cases

_To define (#1489):_ tab-specific cases.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1489._
