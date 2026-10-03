# Domains tab

> **Status:** stub · **Owner:** #1487 · **Route:** `/staff/statistics/domains` · Back to the
> [hub](../access-statistics.md)

## Purpose

Per-domain comparison, as a chart and a table, including "unknown". Domain is also a filter
on every tab.

## Decided

- Sessions with `domain = NULL` are shown as an **"unknown"** bucket, never dropped (see
  [data model](data-model.md)).
- Domain is also a shared filter on every tab (see
  [shared infrastructure](shared-infrastructure.md)).

## Metrics

_To define (#1487):_ the per-domain comparison: which metrics (visits, visitors, duration),
in terms of `Visit` and the visitor key (see [data model](data-model.md)).

## Filters

_To define (#1487):_ how the tab interacts with the domain filter (see
[shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1487):_ the chart and table layout.

## API

_To define (#1487):_ the endpoint response shape.

## Edge cases

_To define (#1487):_ the "unknown" bucket for null domains.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1487._
