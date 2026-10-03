# Users tab

> **Status:** stub · **Owner:** #1488 · **Route:** `/staff/statistics/users` · Back to the
> [hub](../access-statistics.md)

## Purpose

Logged-in users ranked by visits and time on site, with last seen. Clicking a user applies
the user filter on the other tabs.

## Decided

- Lists logged-in users only; all staff see user identities (see
  [access and security](access-and-security.md)).
- Clicking a user sets `?user=<id>` in the URL query, applying the user filter on the other
  tabs (see [shared infrastructure](shared-infrastructure.md)).
- The ranking is limited to the top N and paginated.

## Metrics

_To define (#1488):_ the ranking metric(s) for logged-in users: visits, time on site (see
[data model](data-model.md)).

## Filters

_To define (#1488):_ which shared filters apply, and any tab-specific behavior (see
[shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1488):_ the columns (including last seen); top N and pagination (per
[`pagination.md`](../../pagination.md)); clicking a user sets the `user` filter on the other
tabs.

## API

_To define (#1488):_ the endpoint response shape.

## Edge cases

_To define (#1488):_ tab-specific cases.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1488._
