# Visitors tab

> **Status:** stub · **Owner:** #1485 · **Route:** `/staff/statistics/visitors` · Back to
> the [hub](../access-statistics.md)

## Purpose

Unique visitors over time, split into new and returning, and anonymous and logged-in.

## Decided

- "Unique visitors" means distinct visitors with visits, using the visitor key, and is an
  estimate (see [data model](data-model.md)).
- Split into new vs returning, and anonymous vs logged-in.

## Metrics

_To define (#1485):_ unique visitors per bucket, using the visitor key; the definition of
**new vs returning**, e.g. whether the session existed before the bucket or before the range
(see [data model](data-model.md)).

## Filters

_To define (#1485):_ which shared filters apply, and any tab-specific behavior (see
[shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1485):_ the anonymous vs logged-in split; the chart type.

## API

_To define (#1485):_ the endpoint response shape.

## Edge cases

_To define (#1485):_ tab-specific cases.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1485._
